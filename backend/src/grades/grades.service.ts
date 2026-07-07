import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GradeComponentType, Prisma, Role } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { JwtUser } from '../common/decorators/current-user.decorator';
import { CreateGradeBookDto } from './dto/create-grade-book.dto';
import { UpdateGradeBookDto } from './dto/update-grade-book.dto';
import { QueryGradeBookDto } from './dto/query-grade-book.dto';
import { SaveScoresDto } from './dto/save-scores.dto';

/** Bulatkan ke `d` desimal (buang derau floating point). */
function round(n: number, d = 2): number {
  const f = 10 ** d;
  return Math.round(n * f) / f;
}

function avg(nums: number[]): number | null {
  if (!nums.length) return null;
  return round(nums.reduce((a, b) => a + b, 0) / nums.length);
}

/** Predikat K13: A (86–100), B (71–85), C (56–70), D (<56). */
function predikat(n: number | null): 'A' | 'B' | 'C' | 'D' | null {
  if (n === null) return null;
  if (n >= 86) return 'A';
  if (n >= 71) return 'B';
  if (n >= 56) return 'C';
  return 'D';
}

const BOOK_INCLUDE = {
  class: { select: { id: true, name: true, academicYear: true } },
  subject: { select: { id: true, name: true } },
  teacher: { select: { id: true, fullName: true } },
  kds: { orderBy: { nomor: 'asc' } },
} satisfies Prisma.GradeBookInclude;

@Injectable()
export class GradesService {
  constructor(private prisma: PrismaService) {}

  // ---------- Buku nilai ----------

  /** Cari satu buku nilai berdasarkan kombinasi kelas+mapel+tahun+cawu. */
  async findBook(query: QueryGradeBookDto) {
    if (!query.classId || !query.subjectId || !query.academicYear || !query.cawu) {
      throw new BadRequestException(
        'classId, subjectId, academicYear, dan cawu wajib diisi',
      );
    }
    return this.prisma.gradeBook.findUnique({
      where: {
        classId_subjectId_academicYear_cawu: {
          classId: query.classId,
          subjectId: query.subjectId,
          academicYear: query.academicYear,
          cawu: Number(query.cawu),
        },
      },
      include: BOOK_INCLUDE,
    });
  }

  /** Daftar buku nilai (untuk daftar/overview), dengan filter opsional. */
  async listBooks(query: QueryGradeBookDto, user: JwtUser) {
    const where: Prisma.GradeBookWhereInput = {
      ...(query.classId ? { classId: query.classId } : {}),
      ...(query.subjectId ? { subjectId: query.subjectId } : {}),
      ...(query.academicYear ? { academicYear: query.academicYear } : {}),
      ...(query.cawu ? { cawu: Number(query.cawu) } : {}),
      // Guru hanya melihat buku nilai miliknya; admin semua.
      ...(user.role === Role.GURU ? { teacherId: user.userId } : {}),
    };
    return this.prisma.gradeBook.findMany({
      where,
      include: BOOK_INCLUDE,
      orderBy: [{ academicYear: 'desc' }, { cawu: 'asc' }],
    });
  }

  /** Buat buku nilai baru + KD 1..jumlahKd. Idempoten bila sudah ada. */
  async createBook(dto: CreateGradeBookDto, user: JwtUser) {
    const kelas = await this.prisma.class.findUnique({
      where: { id: dto.classId },
      select: { academicYear: true },
    });
    if (!kelas) throw new NotFoundException('Kelas tidak ditemukan');

    const academicYear = dto.academicYear ?? kelas.academicYear;
    const jumlahKd = Math.min(Math.max(dto.jumlahKd ?? 5, 1), 20);

    const existing = await this.prisma.gradeBook.findUnique({
      where: {
        classId_subjectId_academicYear_cawu: {
          classId: dto.classId,
          subjectId: dto.subjectId,
          academicYear,
          cawu: dto.cawu,
        },
      },
      include: BOOK_INCLUDE,
    });
    if (existing) return existing;

    return this.prisma.gradeBook.create({
      data: {
        classId: dto.classId,
        subjectId: dto.subjectId,
        teacherId: dto.teacherId ?? user.userId,
        academicYear,
        cawu: dto.cawu,
        kkm: dto.kkm ?? 75,
        kds: {
          create: Array.from({ length: jumlahKd }, (_, i) => ({
            nomor: i + 1,
          })),
        },
      },
      include: BOOK_INCLUDE,
    });
  }

  private async getBookOrThrow(id: string) {
    const book = await this.prisma.gradeBook.findUnique({
      where: { id },
      include: BOOK_INCLUDE,
    });
    if (!book) throw new NotFoundException('Buku nilai tidak ditemukan');
    return book;
  }

  private assertOwner(book: { teacherId: string }, user: JwtUser) {
    if (user.role === Role.GURU && book.teacherId !== user.userId) {
      throw new ForbiddenException('Hanya dapat mengubah buku nilai milik sendiri');
    }
  }

  async updateBook(id: string, dto: UpdateGradeBookDto, user: JwtUser) {
    const book = await this.getBookOrThrow(id);
    this.assertOwner(book, user);
    return this.prisma.gradeBook.update({
      where: { id },
      data: { kkm: dto.kkm, cawu: dto.cawu, teacherId: dto.teacherId },
      include: BOOK_INCLUDE,
    });
  }

  async removeBook(id: string, user: JwtUser) {
    const book = await this.getBookOrThrow(id);
    this.assertOwner(book, user);
    await this.prisma.gradeBook.delete({ where: { id } });
    return { message: 'Buku nilai dihapus' };
  }

  // ---------- KD ----------

  async addKd(bookId: string, deskripsi: string | undefined, user: JwtUser) {
    const book = await this.getBookOrThrow(bookId);
    this.assertOwner(book, user);
    const last = await this.prisma.gradeKd.findFirst({
      where: { gradeBookId: bookId },
      orderBy: { nomor: 'desc' },
      select: { nomor: true },
    });
    return this.prisma.gradeKd.create({
      data: {
        gradeBookId: bookId,
        nomor: (last?.nomor ?? 0) + 1,
        deskripsi: deskripsi ?? null,
      },
    });
  }

  async updateKd(kdId: string, deskripsi: string | undefined, user: JwtUser) {
    const kd = await this.prisma.gradeKd.findUnique({
      where: { id: kdId },
      include: { gradeBook: { select: { teacherId: true } } },
    });
    if (!kd) throw new NotFoundException('KD tidak ditemukan');
    this.assertOwner(kd.gradeBook, user);
    return this.prisma.gradeKd.update({
      where: { id: kdId },
      data: { deskripsi: deskripsi ?? null },
    });
  }

  async removeKd(kdId: string, user: JwtUser) {
    const kd = await this.prisma.gradeKd.findUnique({
      where: { id: kdId },
      include: { gradeBook: { select: { teacherId: true } } },
    });
    if (!kd) throw new NotFoundException('KD tidak ditemukan');
    this.assertOwner(kd.gradeBook, user);
    await this.prisma.gradeKd.delete({ where: { id: kdId } });
    return { message: 'KD dihapus' };
  }

  // ---------- Nilai ----------

  /** Simpan nilai mentah secara massal. nilai=null berarti hapus sel. */
  async saveScores(bookId: string, dto: SaveScoresDto, user: JwtUser) {
    const book = await this.getBookOrThrow(bookId);
    this.assertOwner(book, user);

    // Integritas: setiap KD harus milik buku ini & setiap siswa anggota kelas
    // buku ini (cegah nilai "nyasar" ke KD/siswa lain lewat API).
    const kdIds = new Set(book.kds.map((k) => k.id));
    const classStudents = await this.prisma.student.findMany({
      where: { classId: book.classId },
      select: { id: true },
    });
    const studentIds = new Set(classStudents.map((s) => s.id));
    for (const it of dto.items) {
      if (!kdIds.has(it.kdId)) {
        throw new BadRequestException('KD tidak termasuk dalam buku nilai ini');
      }
      if (!studentIds.has(it.studentId)) {
        throw new BadRequestException('Siswa bukan anggota kelas buku nilai ini');
      }
    }

    const ops: Prisma.PrismaPromise<unknown>[] = [];
    for (const it of dto.items) {
      const key = {
        kdId_studentId_komponen_urutan: {
          kdId: it.kdId,
          studentId: it.studentId,
          komponen: it.komponen,
          urutan: it.urutan,
        },
      };
      if (it.nilai === null || it.nilai === undefined) {
        ops.push(
          this.prisma.gradeScore.deleteMany({
            where: {
              kdId: it.kdId,
              studentId: it.studentId,
              komponen: it.komponen,
              urutan: it.urutan,
            },
          }),
        );
      } else {
        ops.push(
          this.prisma.gradeScore.upsert({
            where: key,
            create: {
              gradeBookId: bookId,
              kdId: it.kdId,
              studentId: it.studentId,
              komponen: it.komponen,
              urutan: it.urutan,
              nilai: it.nilai,
            },
            update: { nilai: it.nilai },
          }),
        );
      }
    }
    await this.prisma.$transaction(ops);
    return this.getFullBook(bookId);
  }

  // ---------- Perhitungan & rekap ----------

  /**
   * Buku nilai lengkap: meta, KD, daftar siswa kelas, nilai mentah, serta
   * ringkasan terhitung (NA per komponen, nilai KD, predikat, NR) dan
   * statistik kelas (daya serap, target kurikulum, rata-rata).
   */
  async getFullBook(bookId: string) {
    const book = await this.getBookOrThrow(bookId);

    const [students, scores] = await Promise.all([
      this.prisma.student.findMany({
        where: { classId: book.classId },
        select: { id: true, nis: true, nisn: true, fullName: true },
        orderBy: { fullName: 'asc' },
      }),
      this.prisma.gradeScore.findMany({ where: { gradeBookId: bookId } }),
    ]);

    // Index nilai: studentId -> kdId -> komponen -> [nilai...]
    type Bucket = Record<
      string,
      Record<string, Record<GradeComponentType, number[]>>
    >;
    const bucket: Bucket = {};
    for (const s of scores) {
      ((bucket[s.studentId] ??= {})[s.kdId] ??= {
        PENGETAHUAN: [],
        PRAKTEK: [],
      })[s.komponen].push(s.nilai);
    }

    const summary = students.map((st) => {
      const kdResults = book.kds.map((kd) => {
        const b = bucket[st.id]?.[kd.id];
        const naP = avg(b?.PENGETAHUAN ?? []);
        const naK = avg(b?.PRAKTEK ?? []);
        const parts = [naP, naK].filter((x): x is number => x !== null);
        const nilaiKd = parts.length ? avg(parts) : null;
        return {
          kdId: kd.id,
          nomor: kd.nomor,
          naPengetahuan: naP,
          naPraktek: naK,
          nilaiKd,
          predikat: predikat(nilaiKd),
        };
      });
      const nilaiKds = kdResults
        .map((k) => k.nilaiKd)
        .filter((x): x is number => x !== null);
      const nr = nilaiKds.length ? avg(nilaiKds) : null;
      return {
        studentId: st.id,
        nis: st.nis,
        nisn: st.nisn,
        fullName: st.fullName,
        kd: kdResults,
        nr,
        predikat: predikat(nr),
        tuntas: nr !== null ? nr >= book.kkm : null,
      };
    });

    // Statistik kelas (footer buku)
    const withNr = summary.filter((s) => s.nr !== null) as (typeof summary[number] & {
      nr: number;
    })[];
    const rataKelas = withNr.length
      ? round(withNr.reduce((a, s) => a + s.nr, 0) / withNr.length)
      : null;
    const jmlTuntas = withNr.filter((s) => s.tuntas).length;
    const targetKurikulum = withNr.length
      ? round((jmlTuntas / withNr.length) * 100, 1)
      : null;

    return {
      book,
      students,
      scores, // nilai mentah untuk grid input
      summary,
      stats: {
        jumlahSiswa: students.length,
        jumlahDinilai: withNr.length,
        jumlahTuntas: jmlTuntas,
        rataKelas,
        dayaSerap: rataKelas, // rata-rata (dari maksimum 100) = daya serap %
        targetKurikulum, // % siswa mencapai KKM
      },
    };
  }
}
