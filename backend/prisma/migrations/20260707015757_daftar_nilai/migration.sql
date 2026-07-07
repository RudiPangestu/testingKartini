-- CreateEnum
CREATE TYPE "GradeComponentType" AS ENUM ('PENGETAHUAN', 'PRAKTEK');

-- CreateTable
CREATE TABLE "grade_books" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "academic_year" TEXT NOT NULL,
    "cawu" INTEGER NOT NULL,
    "kkm" INTEGER NOT NULL DEFAULT 75,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_books_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_kds" (
    "id" TEXT NOT NULL,
    "grade_book_id" TEXT NOT NULL,
    "nomor" INTEGER NOT NULL,
    "deskripsi" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "grade_kds_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "grade_scores" (
    "id" TEXT NOT NULL,
    "grade_book_id" TEXT NOT NULL,
    "kd_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "komponen" "GradeComponentType" NOT NULL,
    "urutan" INTEGER NOT NULL,
    "nilai" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "grade_scores_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "grade_books_teacher_id_idx" ON "grade_books"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_books_class_id_subject_id_academic_year_cawu_key" ON "grade_books"("class_id", "subject_id", "academic_year", "cawu");

-- CreateIndex
CREATE UNIQUE INDEX "grade_kds_grade_book_id_nomor_key" ON "grade_kds"("grade_book_id", "nomor");

-- CreateIndex
CREATE INDEX "grade_scores_grade_book_id_idx" ON "grade_scores"("grade_book_id");

-- CreateIndex
CREATE INDEX "grade_scores_student_id_idx" ON "grade_scores"("student_id");

-- CreateIndex
CREATE UNIQUE INDEX "grade_scores_kd_id_student_id_komponen_urutan_key" ON "grade_scores"("kd_id", "student_id", "komponen", "urutan");

-- AddForeignKey
ALTER TABLE "grade_books" ADD CONSTRAINT "grade_books_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_books" ADD CONSTRAINT "grade_books_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_books" ADD CONSTRAINT "grade_books_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_kds" ADD CONSTRAINT "grade_kds_grade_book_id_fkey" FOREIGN KEY ("grade_book_id") REFERENCES "grade_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scores" ADD CONSTRAINT "grade_scores_grade_book_id_fkey" FOREIGN KEY ("grade_book_id") REFERENCES "grade_books"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scores" ADD CONSTRAINT "grade_scores_kd_id_fkey" FOREIGN KEY ("kd_id") REFERENCES "grade_kds"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "grade_scores" ADD CONSTRAINT "grade_scores_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

