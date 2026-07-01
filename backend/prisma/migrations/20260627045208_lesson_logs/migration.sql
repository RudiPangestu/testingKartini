-- CreateTable
CREATE TABLE "lesson_logs" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "subject_id" TEXT,
    "date" TIMESTAMP(3) NOT NULL,
    "jam_ke" TEXT NOT NULL,
    "nama_siswa" TEXT,
    "pokok_bahasan" TEXT NOT NULL,
    "metode" TEXT,
    "selesai" BOOLEAN NOT NULL DEFAULT true,
    "siswa_tidak_hadir" TEXT,
    "refleksi" TEXT,
    "tindak_lanjut" TEXT,
    "academic_year" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_logs_class_id_date_idx" ON "lesson_logs"("class_id", "date");

-- CreateIndex
CREATE INDEX "lesson_logs_teacher_id_idx" ON "lesson_logs"("teacher_id");

-- AddForeignKey
ALTER TABLE "lesson_logs" ADD CONSTRAINT "lesson_logs_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_logs" ADD CONSTRAINT "lesson_logs_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_logs" ADD CONSTRAINT "lesson_logs_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
