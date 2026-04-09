import os

def list_files(startpath, output_file="tree.md", exclude_dirs=None):
    if exclude_dirs is None:
        exclude_dirs = {
            '.git', 'node_modules', '.next', '__pycache__',
            'venv', '.vscode', '.github', 'auto'
        }

    lines = []
    lines.append(f"{os.path.basename(startpath)}/")

    for root, dirs, files in os.walk(startpath):
        original_dirs = list(dirs)
        dirs[:] = [d for d in dirs if d not in exclude_dirs]

        rel_path = os.path.relpath(root, startpath)
        level = 0 if rel_path == "." else rel_path.count(os.sep) + 1

        indent = "│   " * (level - 1) + "├── " if level > 0 else ""
        if level > 0:
            lines.append(f"{indent}{os.path.basename(root)}/")

        file_indent = "│   " * level + "├── "
        for f in files:
            if f != "generate_tree.py":
                lines.append(f"{file_indent}{f}")

        for d in original_dirs:
            if d in exclude_dirs:
                lines.append(f"{file_indent}{d}/ (contents excluded)")

    # Write to file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write("\n".join(lines))


if __name__ == "__main__":
    current_dir = os.path.abspath(".")
    list_files(current_dir)