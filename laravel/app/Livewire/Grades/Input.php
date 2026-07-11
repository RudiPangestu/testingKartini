<?php

namespace App\Livewire\Grades;

use App\Models\GradeBook;
use App\Models\GradeKd;
use App\Models\GradeScore;
use App\Models\Student;
use App\Support\GradeCalc;
use Livewire\Attributes\Layout;
use Livewire\Component;

#[Layout('components.layouts.app')]
class Input extends Component
{
    public string $bookId;
    public string $newKdNomor = '';
    public string $newKdDeskripsi = '';

    /** scores[kdId][studentId][KOMPONEN] = nilai */
    public array $scores = [];

    public function mount(GradeBook $book): void
    {
        $this->bookId = $book->id;
        $this->loadScores();
    }

    protected function loadScores(): void
    {
        $this->scores = [];
        $rows = GradeScore::where('grade_book_id', $this->bookId)->where('urutan', 1)->get();
        foreach ($rows as $s) {
            $this->scores[$s->kd_id][$s->student_id][$s->komponen->value] = $s->nilai;
        }
    }

    public function addKd(): void
    {
        $this->validate([
            'newKdNomor' => ['required', 'integer', 'min:1', 'max:20'],
            'newKdDeskripsi' => ['nullable', 'string', 'max:255'],
        ]);

        $exists = GradeKd::where('grade_book_id', $this->bookId)->where('nomor', (int) $this->newKdNomor)->exists();
        if ($exists) {
            $this->addError('newKdNomor', 'Nomor KD sudah ada.');

            return;
        }

        GradeKd::create([
            'grade_book_id' => $this->bookId,
            'nomor' => (int) $this->newKdNomor,
            'deskripsi' => $this->newKdDeskripsi ?: null,
        ]);
        $this->newKdNomor = '';
        $this->newKdDeskripsi = '';
    }

    public function removeKd(string $kdId): void
    {
        GradeKd::whereKey($kdId)->delete(); // cascade hapus nilai
        $this->loadScores();
    }

    public function save(): void
    {
        $book = GradeBook::with('kds')->findOrFail($this->bookId);
        $kdIds = $book->kds->pluck('id')->all();
        $studentIds = Student::where('class_id', $book->class_id)->pluck('id')->all();

        foreach ($kdIds as $kdId) {
            foreach ($studentIds as $studentId) {
                foreach (['PENGETAHUAN', 'PRAKTEK'] as $komp) {
                    $val = $this->scores[$kdId][$studentId][$komp] ?? null;
                    $key = ['grade_book_id' => $this->bookId, 'kd_id' => $kdId, 'student_id' => $studentId, 'komponen' => $komp, 'urutan' => 1];

                    if ($val === null || $val === '') {
                        GradeScore::where($key)->delete();
                    } else {
                        $num = max(0, min(100, (float) $val));
                        GradeScore::updateOrCreate($key, ['nilai' => $num]);
                    }
                }
            }
        }

        $this->loadScores();
        session()->flash('ok', 'Nilai tersimpan.');
    }

    public function render()
    {
        $book = GradeBook::with(['kds' => fn ($q) => $q->orderBy('nomor'), 'schoolClass', 'subject'])->findOrFail($this->bookId);
        $students = Student::where('class_id', $book->class_id)->orderBy('full_name')->get(['id', 'nisn', 'full_name']);

        // Ringkasan per siswa (dihitung dari $this->scores agar reaktif).
        $summary = [];
        $nrList = [];
        foreach ($students as $st) {
            $kdVals = [];
            $cells = [];
            foreach ($book->kds as $kd) {
                $peng = $this->scores[$kd->id][$st->id]['PENGETAHUAN'] ?? null;
                $prak = $this->scores[$kd->id][$st->id]['PRAKTEK'] ?? null;
                $nilaiKd = GradeCalc::avg([$peng, $prak]);
                if ($nilaiKd !== null) {
                    $kdVals[] = $nilaiKd;
                }
                $cells[$kd->id] = $nilaiKd;
            }
            $nr = GradeCalc::avg($kdVals);
            if ($nr !== null) {
                $nrList[] = $nr;
            }
            $summary[$st->id] = [
                'cells' => $cells,
                'nr' => $nr,
                'predikat' => GradeCalc::predikat($nr),
                'tuntas' => $nr === null ? null : $nr >= $book->kkm,
            ];
        }

        $jumlahTuntas = count(array_filter($summary, fn ($r) => $r['tuntas'] === true));
        $stats = [
            'jumlahSiswa' => $students->count(),
            'jumlahDinilai' => count($nrList),
            'jumlahTuntas' => $jumlahTuntas,
            'rataKelas' => GradeCalc::avg($nrList),
            'targetKurikulum' => $students->count() ? round($jumlahTuntas / $students->count() * 100, 1) : null,
        ];

        return view('livewire.grades.input', compact('book', 'students', 'summary', 'stats'));
    }
}
