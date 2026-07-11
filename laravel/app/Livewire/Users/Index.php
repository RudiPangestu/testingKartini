<?php

namespace App\Livewire\Users;

use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Livewire\Attributes\Layout;
use Livewire\Component;
use Livewire\WithPagination;

#[Layout('components.layouts.app')]
class Index extends Component
{
    use WithPagination;

    public string $search = '';
    public string $roleFilter = '';

    public bool $showModal = false;
    public ?string $editingId = null;

    public string $role = 'GURU';
    public string $full_name = '';
    public string $email = '';
    public string $phone = '';
    public string $password = '';
    public bool $is_active = true;

    public function updatingSearch(): void
    {
        $this->resetPage();
    }

    public function updatingRoleFilter(): void
    {
        $this->resetPage();
    }

    public function create(): void
    {
        $this->reset(['editingId', 'role', 'full_name', 'email', 'phone', 'password', 'is_active']);
        $this->role = 'GURU';
        $this->is_active = true;
        $this->showModal = true;
    }

    public function edit(string $id): void
    {
        $u = User::findOrFail($id);
        $this->editingId = $u->id;
        $this->role = $u->role->value;
        $this->full_name = $u->full_name;
        $this->email = $u->email;
        $this->phone = $u->phone ?? '';
        $this->password = '';
        $this->is_active = $u->is_active;
        $this->showModal = true;
    }

    public function save(): void
    {
        $data = $this->validate([
            'role' => ['required', Rule::in(['ADMIN', 'GURU', 'ORTU', 'MURID'])],
            'full_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', Rule::unique('users', 'email')->ignore($this->editingId)],
            'phone' => ['nullable', 'string', 'max:40'],
            'password' => [$this->editingId ? 'nullable' : 'required', 'min:6'],
            'is_active' => ['boolean'],
        ]);

        $payload = [
            'role' => $data['role'],
            'full_name' => $data['full_name'],
            'email' => $data['email'],
            'phone' => $data['phone'] ?: null,
            'is_active' => $data['is_active'],
        ];
        if (! empty($data['password'])) {
            $payload['password_hash'] = Hash::make($data['password']);
        }

        if ($this->editingId) {
            User::whereKey($this->editingId)->update($payload);
        } else {
            User::create($payload);
        }

        $this->showModal = false;
        session()->flash('ok', 'Pengguna tersimpan.');
    }

    public function delete(string $id): void
    {
        if ($id === auth()->id()) {
            session()->flash('err', 'Tidak bisa menghapus akun sendiri.');

            return;
        }
        try {
            User::whereKey($id)->delete();
            session()->flash('ok', 'Pengguna dihapus.');
        } catch (\Throwable $e) {
            session()->flash('err', 'Gagal menghapus: pengguna masih terkait data lain.');
        }
    }

    public function render()
    {
        $users = User::query()
            ->when($this->roleFilter, fn ($q) => $q->where('role', $this->roleFilter))
            ->when($this->search, fn ($q) => $q->where(fn ($w) => $w
                ->where('full_name', 'like', "%{$this->search}%")
                ->orWhere('email', 'like', "%{$this->search}%")))
            ->orderBy('full_name')
            ->paginate(15);

        return view('livewire.users.index', ['users' => $users]);
    }
}
