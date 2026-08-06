import { BadRequestException, Injectable } from '@nestjs/common';
import { Gender, Prisma, Role } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import * as argon2 from 'argon2';
import { PrismaService } from '../prisma/prisma.service';

export interface ImportResult {
  total: number;
  created: number;
  skipped: number;
  linked?: number;
  errors: { row: number; message: string }[];
}

// Batas aman agar satu unggahan tidak berjalan terlalu lama.
const MAX_ROWS = 5000;

/** Nilai sel Excel -> teks bersih (menangani formula, rich text, dsb). */
function cellText(cell: ExcelJS.Cell): string {
  const v = cell.value as unknown;
  if (v === null || v === undefined) return '';
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'object') {
    const o = v as Record<string, unknown>;
    if (typeof o.text === 'string') return o.text.trim();
    if (o.result !== undefined) return String(o.result).trim();
    if (Array.isArray(o.richText)) {
      return (o.richText as { text: string }[]).map((r) => r.text).join('').trim();
    }
    if (typeof o.hyperlink === 'string') return String(o.text ?? o.hyperlink).trim();
    return String(v).trim();
  }
  return String(v).trim();
}

/** Ambil nilai kolom berdasarkan salah satu nama header (case-insensitive). */
function pick(row: Record<string, string>, ...names: string[]): string {
  const keys = Object.keys(row);
  for (const n of names) {
    const found = keys.find((k) => k.toLowerCase() === n.toLowerCase());
    if (found && row[found]) return row[found].trim();
  }
  return '';
}

const TEMPLATES: Record<string, { headers: string[]; example: string[] }> = {
  classes: {
    headers: ['Nama Kelas', 'Tingkat', 'Tahun Ajaran'],
    example: ['X IPA 1', '10', '2025/2026'],
  },
  subjects: {
    headers: ['Nama Mapel', 'Kode'],
    example: ['Matematika', 'MAT'],
  },
  students: {
    headers: ['NISN', 'NIS', 'Nama', 'Kelas', 'JK'],
    example: ['0012345678', '12345', 'Budi Santoso', 'X IPA 1', 'L'],
  },
  parents: {
    headers: ['Nama Orang Tua', 'Email', 'No. HP', 'Password', 'NISN Anak', 'Hubungan'],
    example: ['Ani Wijaya', 'ani@email.com', '08123456789', 'kartini123', '0012345678', 'ibu'],
  },
};

@Injectable()
export class ImportService {
  constructor(private prisma: PrismaService) {}

  private async parseRows(buffer: Buffer): Promise<Record<string, string>[]> {
    if (!buffer?.length) throw new BadRequestException('File kosong');
    const wb = new ExcelJS.Workbook();
    try {
      await wb.xlsx.load(buffer as unknown as Parameters<typeof wb.xlsx.load>[0]);
    } catch {
      throw new BadRequestException('File bukan Excel (.xlsx) yang valid');
    }
    const ws = wb.worksheets[0];
    if (!ws) throw new BadRequestException('Sheet tidak ditemukan di file');

    const headers: string[] = [];
    ws.getRow(1).eachCell({ includeEmpty: true }, (cell, col) => {
      headers[col] = cellText(cell);
    });

    const rows: Record<string, string>[] = [];
    ws.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      const obj: Record<string, string> = { __row: String(rowNumber) };
      let empty = true;
      row.eachCell({ includeEmpty: true }, (cell, col) => {
        const h = headers[col];
        if (!h) return;
        const t = cellText(cell);
        obj[h] = t;
        if (t) empty = false;
      });
      if (!empty) rows.push(obj);
    });

    if (rows.length > MAX_ROWS) {
      throw new BadRequestException(
        `Maksimal ${MAX_ROWS} baris per unggahan. Pecah file menjadi beberapa bagian.`,
      );
    }
    return rows;
  }

  /** Template .xlsx berisi header + satu baris contoh. */
  async template(entity: string) {
    const spec = TEMPLATES[entity];
    if (!spec) throw new BadRequestException('Jenis template tidak dikenal');
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Template');
    ws.addRow(spec.headers);
    ws.getRow(1).font = { bold: true };
    ws.addRow(spec.example);
    ws.columns.forEach((c) => {
      c.width = 20;
    });
    const buffer = Buffer.from(await wb.xlsx.writeBuffer());
    return { buffer, filename: `template-${entity}.xlsx` };
  }

  // ---------------- KELAS ----------------
  async importClasses(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const res: ImportResult = { total: rows.length, created: 0, skipped: 0, errors: [] };

    const existing = await this.prisma.class.findMany({
      select: { name: true, academicYear: true },
    });
    const seen = new Set(existing.map((c) => `${c.name}|${c.academicYear}`));
    const toCreate: Prisma.ClassCreateManyInput[] = [];

    for (const r of rows) {
      const row = Number(r.__row);
      const name = pick(r, 'Nama Kelas', 'Nama', 'Kelas');
      const gradeStr = pick(r, 'Tingkat', 'Grade');
      const year = pick(r, 'Tahun Ajaran', 'Tahun', 'Academic Year');
      if (!name) {
        res.errors.push({ row, message: 'Nama kelas kosong' });
        continue;
      }
      if (!year) {
        res.errors.push({ row, message: 'Tahun ajaran kosong' });
        continue;
      }
      const grade = parseInt(gradeStr, 10);
      if (Number.isNaN(grade)) {
        res.errors.push({ row, message: 'Tingkat harus angka (mis. 10)' });
        continue;
      }
      const key = `${name}|${year}`;
      if (seen.has(key)) {
        res.skipped++;
        continue;
      }
      seen.add(key);
      toCreate.push({ name, grade, academicYear: year });
    }
    if (toCreate.length) {
      const c = await this.prisma.class.createMany({ data: toCreate, skipDuplicates: true });
      res.created = c.count;
    }
    return res;
  }

  // ---------------- MATA PELAJARAN ----------------
  async importSubjects(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const res: ImportResult = { total: rows.length, created: 0, skipped: 0, errors: [] };

    const existing = await this.prisma.subject.findMany({ select: { name: true, code: true } });
    const nameSeen = new Set(existing.map((s) => s.name.toLowerCase()));
    const codeSeen = new Set(existing.filter((s) => s.code).map((s) => s.code!.toLowerCase()));
    const toCreate: Prisma.SubjectCreateManyInput[] = [];

    for (const r of rows) {
      const row = Number(r.__row);
      const name = pick(r, 'Nama Mapel', 'Nama', 'Mata Pelajaran');
      const code = pick(r, 'Kode', 'Code');
      if (!name) {
        res.errors.push({ row, message: 'Nama mapel kosong' });
        continue;
      }
      if (code && codeSeen.has(code.toLowerCase())) {
        res.skipped++;
        continue;
      }
      if (!code && nameSeen.has(name.toLowerCase())) {
        res.skipped++;
        continue;
      }
      nameSeen.add(name.toLowerCase());
      if (code) codeSeen.add(code.toLowerCase());
      toCreate.push({ name, code: code || null });
    }
    if (toCreate.length) {
      const c = await this.prisma.subject.createMany({ data: toCreate, skipDuplicates: true });
      res.created = c.count;
    }
    return res;
  }

  // ---------------- MURID ----------------
  async importStudents(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const res: ImportResult = { total: rows.length, created: 0, skipped: 0, errors: [] };

    const [classes, students] = await Promise.all([
      this.prisma.class.findMany({
        select: { id: true, name: true, academicYear: true },
        orderBy: { academicYear: 'desc' },
      }),
      this.prisma.student.findMany({ select: { nisn: true } }),
    ]);
    // name(lower) -> classId (tahun terbaru menang bila nama sama).
    const classMap = new Map<string, string>();
    for (const c of classes) {
      const k = c.name.toLowerCase();
      if (!classMap.has(k)) classMap.set(k, c.id);
    }
    // NISN opsional: hanya NISN yang terisi yang dipakai untuk cegah duplikat.
    const nisnSeen = new Set(
      students.map((s) => s.nisn).filter((n): n is string => !!n),
    );
    const toCreate: Prisma.StudentCreateManyInput[] = [];

    for (const r of rows) {
      const row = Number(r.__row);
      const nisn = pick(r, 'NISN');
      const nis = pick(r, 'NIS');
      const fullName = pick(r, 'Nama', 'Nama Lengkap', 'Nama Siswa');
      const className = pick(r, 'Kelas', 'Nama Kelas');
      const jk = pick(r, 'JK', 'Jenis Kelamin', 'Gender').toUpperCase();

      if (!fullName) {
        res.errors.push({ row, message: 'Nama kosong' });
        continue;
      }
      // Lewati duplikat hanya bila NISN diisi (NISN kosong diizinkan).
      if (nisn && nisnSeen.has(nisn)) {
        res.skipped++;
        continue;
      }
      let classId: string | null = null;
      if (className) {
        const found = classMap.get(className.toLowerCase());
        if (!found) {
          res.errors.push({ row, message: `Kelas "${className}" tidak ditemukan` });
          continue;
        }
        classId = found;
      }
      const gender: Gender | null = jk === 'L' ? Gender.L : jk === 'P' ? Gender.P : null;
      if (nisn) nisnSeen.add(nisn);
      toCreate.push({ nisn: nisn || null, nis: nis || null, fullName, classId, gender });
    }
    if (toCreate.length) {
      const c = await this.prisma.student.createMany({ data: toCreate, skipDuplicates: true });
      res.created = c.count;
    }
    return res;
  }

  // ---------------- AKUN ORANG TUA (+ penautan) ----------------
  async importParents(buffer: Buffer): Promise<ImportResult> {
    const rows = await this.parseRows(buffer);
    const res: ImportResult = { total: rows.length, created: 0, skipped: 0, linked: 0, errors: [] };

    const [users, students, links] = await Promise.all([
      this.prisma.user.findMany({ select: { id: true, email: true, role: true } }),
      this.prisma.student.findMany({ select: { id: true, nisn: true } }),
      this.prisma.studentParent.findMany({ select: { studentId: true, parentUserId: true } }),
    ]);
    const userByEmail = new Map(users.map((u) => [u.email.toLowerCase(), u]));
    const studentByNisn = new Map(students.map((s) => [s.nisn, s.id]));
    const linkSet = new Set(links.map((l) => `${l.studentId}|${l.parentUserId}`));

    for (const r of rows) {
      const row = Number(r.__row);
      try {
        const fullName = pick(r, 'Nama Orang Tua', 'Nama Ortu', 'Nama');
        const email = pick(r, 'Email').toLowerCase();
        const phone = pick(r, 'No. HP', 'HP', 'No HP', 'Telepon', 'Phone');
        const password = pick(r, 'Password', 'Kata Sandi');
        const childNisn = pick(r, 'NISN Anak', 'NISN', 'NISN Murid');
        const relation = pick(r, 'Hubungan', 'Relasi', 'Relation') || null;

        if (!fullName || !email) {
          res.errors.push({ row, message: 'Nama & email wajib diisi' });
          continue;
        }

        let userId: string;
        const existing = userByEmail.get(email);
        if (existing) {
          if (existing.role !== Role.ORTU) {
            res.errors.push({ row, message: `Email ${email} dipakai akun non-ortu` });
            continue;
          }
          userId = existing.id; // gunakan ulang (password diabaikan)
        } else {
          if (!password) {
            res.errors.push({ row, message: 'Password kosong untuk akun baru' });
            continue;
          }
          const created = await this.prisma.user.create({
            data: {
              role: Role.ORTU,
              fullName,
              email,
              phone: phone || null,
              passwordHash: await argon2.hash(password),
              isActive: true,
            },
            select: { id: true, email: true, role: true },
          });
          userId = created.id;
          userByEmail.set(email, created);
          res.created++;
        }

        // Penautan ke anak (opsional).
        if (childNisn) {
          const studentId = studentByNisn.get(childNisn);
          if (!studentId) {
            res.errors.push({ row, message: `NISN anak "${childNisn}" tidak ditemukan` });
            continue;
          }
          const key = `${studentId}|${userId}`;
          if (!linkSet.has(key)) {
            await this.prisma.studentParent.create({
              data: { studentId, parentUserId: userId, relation },
            });
            linkSet.add(key);
            res.linked = (res.linked ?? 0) + 1;
          }
        }
      } catch (e) {
        res.errors.push({ row, message: (e as Error).message ?? 'Gagal memproses baris' });
      }
    }
    return res;
  }
}
