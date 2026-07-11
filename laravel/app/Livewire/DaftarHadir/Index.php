<?php

namespace App\Livewire\DaftarHadir;

use App\Models\Attendance;
use App\Models\AttendanceSession;
use App\Models\SchoolClass;
use App\Models\Student;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Index extends Component
{
    public string $classId = '';

    public function render()
    {
        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
        $sessions = collect();
        $students = collect();
        $matrix = [];

        if ($this->classId) {
            $sessions = AttendanceSession::where('class_id', $this->classId)
                ->orderBy('session_date')->get(['id', 'session_date']);
            $students = Student::where('class_id', $this->classId)
                ->orderBy('full_name')->get(['id', 'nisn', 'full_name']);

            $recs = Attendance::whereIn('session_id', $sessions->pluck('id'))
                ->get(['student_id', 'session_id', 'status']);
            foreach ($recs as $r) {
                $matrix[$r->student_id][$r->session_id] = $r->status->value;
            }
        }

        return view('livewire.daftar-hadir.index', compact('classes', 'sessions', 'students', 'matrix'));
    }
}
