import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as argon2 from 'argon2';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/**
 * E2E backend: menelusuri alur nyata melalui HTTP terhadap database sungguhan.
 * Membutuhkan PostgreSQL (DATABASE_URL) yang skemanya sudah dimigrasi.
 * Jalankan: npm run test:e2e
 */
describe('SIPRES Kartini API (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let token: string;
  let ortuId: string;
  let ortuToken: string;
  let classId: string;
  let studentId: string;
  let sessionId: string;

  // Email unik per run agar test idempoten terhadap DB yang persisten.
  const ADMIN = {
    email: `e2e-admin-${Date.now()}@kartini.sch.id`,
    password: 'admin12345',
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, transform: true }),
    );
    await app.init();

    prisma = app.get(PrismaService);

    // Siapkan admin uji (email unik per run)
    await prisma.user.create({
      data: {
        email: ADMIN.email,
        passwordHash: await argon2.hash(ADMIN.password),
        fullName: 'E2E Admin',
        role: 'ADMIN',
      },
    });
  });

  afterAll(async () => {
    await app?.close();
  });

  const http = () => request(app.getHttpServer());

  it('login admin mengembalikan access token', async () => {
    const res = await http().post('/api/v1/auth/login').send(ADMIN).expect(200);
    expect(res.body.accessToken).toBeDefined();
    expect(res.body.refreshToken).toBeDefined();
    expect(res.body.user.role).toBe('ADMIN');
    token = res.body.accessToken;
  });

  it('rotasi refresh token: token lama tak bisa dipakai ulang', async () => {
    const login = await http().post('/api/v1/auth/login').send(ADMIN).expect(200);
    const oldRefresh = login.body.refreshToken;

    // refresh pertama berhasil (rotasi -> token lama dicabut)
    const refreshed = await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(200);
    expect(refreshed.body.refreshToken).not.toBe(oldRefresh);

    // memakai ulang token lama -> ditolak
    await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: oldRefresh })
      .expect(401);
  });

  it('logout mencabut refresh token', async () => {
    const login = await http().post('/api/v1/auth/login').send(ADMIN).expect(200);
    const rt = login.body.refreshToken;

    await http().post('/api/v1/auth/logout').send({ refreshToken: rt }).expect(200);
    await http()
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: rt })
      .expect(401);
  });

  it('menolak akses tanpa token (401)', async () => {
    await http().get('/api/v1/users').expect(401);
  });

  it('admin membuat ortu, kelas, murid, dan menautkannya', async () => {
    const auth = { Authorization: `Bearer ${token}` };

    const ortu = await http()
      .post('/api/v1/users')
      .set(auth)
      .send({
        role: 'ORTU',
        fullName: 'E2E Ortu',
        email: `e2e-ortu-${Date.now()}@mail.com`,
        password: 'ortu12345',
      })
      .expect(201);
    ortuId = ortu.body.id;

    const kelas = await http()
      .post('/api/v1/classes')
      .set(auth)
      .send({ name: 'E2E-X1', grade: 10, academicYear: '2025/2026' })
      .expect(201);
    classId = kelas.body.id;

    const murid = await http()
      .post('/api/v1/students')
      .set(auth)
      .send({
        nisn: `e2e-${Date.now()}`,
        fullName: 'E2E Murid',
        classId,
        gender: 'P',
      })
      .expect(201);
    studentId = murid.body.id;

    await http()
      .post(`/api/v1/students/${studentId}/parents`)
      .set(auth)
      .send({ parentUserId: ortuId, relation: 'ibu' })
      .expect(201);
  });

  it('presensi SAKIT memicu notifikasi ke inbox ortu', async () => {
    const auth = { Authorization: `Bearer ${token}` };

    const subject = await http()
      .post('/api/v1/subjects')
      .set(auth)
      .send({ name: 'E2E IPA' })
      .expect(201);
    const teacher = await http()
      .post('/api/v1/users')
      .set(auth)
      .send({
        role: 'GURU',
        fullName: 'E2E Guru',
        email: `e2e-guru-${Date.now()}@mail.com`,
        password: 'guru12345',
      })
      .expect(201);
    const schedule = await http()
      .post('/api/v1/schedules')
      .set(auth)
      .send({
        subjectId: subject.body.id,
        classId,
        teacherId: teacher.body.id,
        dayOfWeek: 'SAB',
        startTime: '07:00',
        endTime: '08:30',
        academicYear: '2025/2026',
      })
      .expect(201);
    const session = await http()
      .post('/api/v1/attendance/sessions')
      .set(auth)
      .send({
        sourceType: 'SCHEDULE',
        scheduleId: schedule.body.id,
        sessionDate: '2026-06-13',
      })
      .expect(201);
    sessionId = session.body.id;

    await http()
      .put(`/api/v1/attendance/sessions/${sessionId}`)
      .set(auth)
      .send({ records: [{ studentId, status: 'SAKIT', note: 'demam' }] })
      .expect(200);

    // Login sebagai ortu lalu cek inbox
    const ortuLogin = await http()
      .post('/api/v1/auth/login')
      .send({ email: (await prisma.user.findUnique({ where: { id: ortuId } }))!.email, password: 'ortu12345' })
      .expect(200);
    ortuToken = ortuLogin.body.accessToken;
    const inbox = await http()
      .get('/api/v1/notifications')
      .set({ Authorization: `Bearer ${ortuToken}` })
      .expect(200);

    expect(inbox.body.length).toBeGreaterThanOrEqual(1);
    expect(inbox.body[0].body).toContain('SAKIT');
  });

  it('ortu yang tertaut boleh mengakses laporan anaknya (200)', async () => {
    await http()
      .get(`/api/v1/reports/student/${studentId}?period=semester`)
      .set({ Authorization: `Bearer ${ortuToken}` })
      .expect(200);
  });

  it('IDOR: ortu TIDAK boleh mengakses murid yang tak tertaut (403)', async () => {
    const auth = { Authorization: `Bearer ${token}` };
    // murid lain milik admin, tidak ditautkan ke ortu uji
    const other = await http()
      .post('/api/v1/students')
      .set(auth)
      .send({ nisn: `e2e-other-${Date.now()}`, fullName: 'Murid Lain' })
      .expect(201);

    const headers = { Authorization: `Bearer ${ortuToken}` };
    await http().get(`/api/v1/students/${other.body.id}`).set(headers).expect(403);
    await http()
      .get(`/api/v1/reports/student/${other.body.id}?period=semester`)
      .set(headers)
      .expect(403);
    await http()
      .get(`/api/v1/attendance/student/${other.body.id}`)
      .set(headers)
      .expect(403);
  });

  it('menyimpan ulang status yang SAMA tidak menambah notifikasi', async () => {
    const headers = { Authorization: `Bearer ${ortuToken}` };
    const before = (await http().get('/api/v1/notifications').set(headers)).body
      .length;

    // PUT ulang dengan status identik (SAKIT) — tidak boleh memicu notifikasi baru
    await http()
      .put(`/api/v1/attendance/sessions/${sessionId}`)
      .set({ Authorization: `Bearer ${token}` })
      .send({ records: [{ studentId, status: 'SAKIT', note: 'demam' }] })
      .expect(200);

    const after = (await http().get('/api/v1/notifications').set(headers)).body
      .length;
    expect(after).toBe(before);
  });

  it('laporan individual: Sakit dihitung Kehadiran Sah, bukan Alpha', async () => {
    const res = await http()
      .get(`/api/v1/reports/student/${studentId}?period=semester`)
      .set({ Authorization: `Bearer ${token}` })
      .expect(200);

    expect(res.body.sakit).toBe(1);
    expect(res.body.alpha).toBe(0);
    expect(res.body.kehadiranSahPct).toBe(100);
    expect(res.body.alphaPct).toBe(0);
  });
});
