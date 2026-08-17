-- CreateEnum
CREATE TYPE "ViolationLevel" AS ENUM ('RINGAN', 'SEDANG', 'BERAT');

-- CreateTable
CREATE TABLE "violation_types" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "level" "ViolationLevel" NOT NULL,
    "name" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "violation_types_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_violations" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "type_id" TEXT,
    "description" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "date" DATE NOT NULL,
    "note" TEXT,
    "recorded_by" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_violations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "violation_types_level_idx" ON "violation_types"("level");

-- CreateIndex
CREATE INDEX "student_violations_student_id_idx" ON "student_violations"("student_id");

-- AddForeignKey
ALTER TABLE "student_violations" ADD CONSTRAINT "student_violations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_violations" ADD CONSTRAINT "student_violations_type_id_fkey" FOREIGN KEY ("type_id") REFERENCES "violation_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_violations" ADD CONSTRAINT "student_violations_recorded_by_fkey" FOREIGN KEY ("recorded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
