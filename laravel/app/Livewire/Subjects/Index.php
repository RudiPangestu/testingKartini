<?php

namespace App\Livewire\Subjects;

use App\Models\Subject;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public string $search = '';
    public bool $showModal = false;
    public ?string $editingId = null;
    public string $name = '';
    public string $code = '';

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function create(): void
    {
        $this->reset(['editingId', 'name', 'code']);
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $s = Subject::findOrFail($id);
        $this->editingId = $s->id;
        $this->name = $s->name;
        $this->code = $s->code ?? '';
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'name' => ['required', 'string', 'max:255'],
            'code' => ['nullable', 'string', 'max:40', Rule::unique('subjects', 'code')->ignore($this->editingId)],
        ]);

        $payload = ['name' => $data['name'], 'code' => $data['code'] ?: null];

        if ($this->editingId) {
            Subject::whereKey($this->editingId)->update($payload);
        } else {
            Subject::create($payload);
        }

        $this->showModal = false;
        session()->flash('ok', 'Mata pelajaran tersimpan.');
    }

    public function delete(string $id): void
    {
        try {
            Subject::whereKey($id)->delete();
            session()->flash('ok', 'Mata pelajaran dihapus.');
        } catch (\Throwable $e) {
            session()->flash('err', 'Gagal menghapus: mapel masih dipakai jadwal/nilai.');
        }
    }

    public function render()
    {
        $subjects = Subject::query()
            ->when($this->search, fn ($q) => $q->where(fn ($w) => $w
                ->where('name', 'like', "%{$this->search}%")
                ->orWhere('code', 'like', "%{$this->search}%")))
            ->orderBy('name')
            ->paginate(15);

        return view('livewire.subjects.index', ['subjects' => $subjects]);
    }
}
