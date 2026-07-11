<?php

namespace App\Livewire\Grades;

use App\Models\GradeBook;
use App\Models\SchoolClass;
use App\Models\Subject;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public bool $showModal = false;
    public string $class_id = '';
    public string $subject_id = '';
    public string $academic_year = '2025/2026';
    public int $cawu = 1;
    public int $kkm = 75;

    public function create(): void
    {
        $this->reset(['class_id', 'subject_id']);
        $this->academic_year = '2025/2026';
        $this->cawu = 1;
        $this->kkm = 75;
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'class_id' => ['required', 'exists:classes,id'],
            'subject_id' => ['required', 'exists:subjects,id'],
            'academic_year' => ['required', 'string', 'max:20'],
            'cawu' => ['required', 'integer', 'min:1', 'max:3'],
            'kkm' => ['required', 'integer', 'min:0', 'max:100'],
        ]);

        $dupe = GradeBook::where('class_id', $data['class_id'])
            ->where('subject_id', $data['subject_id'])
            ->where('academic_year', $data['academic_year'])
            ->where('cawu', $data['cawu'])
            ->exists();

        if ($dupe) {
            $this->addError('subject_id', 'Buku nilai untuk kombinasi ini sudah ada.');

            return;
        }

        GradeBook::create([...$data, 'teacher_id' => auth()->id()]);
        $this->showModal = false;
        session()->flash('ok', 'Buku nilai dibuat.');
    }

    public function delete(string $id): void
    {
        GradeBook::whereKey($id)->delete();
        session()->flash('ok', 'Buku nilai dihapus.');
    }

    public function render()
    {
        $books = GradeBook::query()
            ->with(['schoolClass', 'subject'])
            ->orderBy('academic_year', 'desc')
            ->orderBy('cawu')
            ->paginate(15);

        $classes = SchoolClass::orderBy('name')->get(['id', 'name']);
        $subjects = Subject::orderBy('name')->get(['id', 'name']);

        return view('livewire.grades.index', compact('books', 'classes', 'subjects'));
    }
}
