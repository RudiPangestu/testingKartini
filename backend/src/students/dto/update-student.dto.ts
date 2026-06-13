import { PartialType } from '@nestjs/mapped-types';
import { CreateStudentDto } from './create-student.dto';

// Admin dapat mengubah SEMUA field murid (termasuk pindah kelas via classId).
export class UpdateStudentDto extends PartialType(CreateStudentDto) {}
