<?php

namespace App\Livewire\Reports;

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
    public string $start = '';
    public string $end = '';

    public function render()
    {
        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
        $rows = [];
        $totals = ['HADIR' => 0, 'SAKIT' => 0, 'IZIN' => 0, 'ALPHA' => 0];

        if ($this->classId) {
            $q = AttendanceSession::where('class_id', $this->classId);
            if ($this->start) {
                $q->whereDate('session_date', '>=', $this->start);
            }
            if ($this->end) {
                $q->whereDate('session_date', '<=', $this->end);
            }
            $sessionIds = $q->pluck('id');

            $students = Student::where('class_id', $this->classId)->orderBy('full_name')->get(['id', 'full_name']);
            $recs = Attendance::whereIn('session_id', $sessionIds)->get(['student_id', 'status']);

            $byStudent = [];
            foreach ($recs as $r) {
                $st = $r->status->value;
                $byStudent[$r->student_id][$st] = ($byStudent[$r->student_id][$st] ?? 0) + 1;
            }

            foreach ($students as $st) {
                $c = $byStudent[$st->id] ?? [];
                $h = $c['HADIR'] ?? 0;
                $s = $c['SAKIT'] ?? 0;
                $i = $c['IZIN'] ?? 0;
                $a = $c['ALPHA'] ?? 0;
                $tot = $h + $s + $i + $a;
                $rows[] = [
                    'name' => $st->full_name,
                    'h' => $h, 's' => $s, 'i' => $i, 'a' => $a, 'tot' => $tot,
                    'pct' => $tot ? round($h / $tot * 100, 1) : null,
                ];
                $totals['HADIR'] += $h;
                $totals['SAKIT'] += $s;
                $totals['IZIN'] += $i;
                $totals['ALPHA'] += $a;
            }
        }

        $grand = array_sum($totals);
        $classPct = $grand ? round($totals['HADIR'] / $grand * 100, 1) : null;

        return view('livewire.reports.index', compact('classes', 'rows', 'totals', 'grand', 'classPct'));
    }
}
