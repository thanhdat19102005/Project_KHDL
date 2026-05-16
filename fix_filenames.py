import os

files_to_fix = [
    r"Project_KHDL.Server\Services\AlertService.cs旋",
    r"Project_KHDL.Server\Models\SystemAlert.cs旋",
    r"Project_KHDL.Server\Controllers\AlertController.cs旋",
    r"project_khdl.client\src\components\DashboardHeader.tsx旋"
]

for f in files_to_fix:
    full_path = os.path.join(r"d:\Thi_KHDL\Project_KHDL", f)
    if os.path.exists(full_path):
        new_path = full_path[:-1] # Remove last char
        print(f"Renaming {full_path} to {new_path}")
        os.rename(full_path, new_path)
    else:
        print(f"File not found: {full_path}")
