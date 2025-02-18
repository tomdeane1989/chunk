import os

# Only these file extensions get copied
ALLOWED_ENDINGS = [".env", ".js", ".jsx", ".json"]

def aggregate_files(folder_path, output_filename):
    """
    Recursively walks 'folder_path' and appends the content of each matching file
    (.env, .js, .jsx, .json) to 'output_filename'.
    """
    with open(output_filename, "a", encoding="utf-8", errors="replace") as out_file:
        for root, dirs, files in os.walk(folder_path):
            for file_name in files:
                lower_name = file_name.lower()
                if any(lower_name.endswith(ext) for ext in ALLOWED_ENDINGS):
                    full_path = os.path.join(root, file_name)
                    # Write a small header so we know where each file came from
                    out_file.write("\n# ----------------------------------------\n")
                    out_file.write(f"# File: {full_path}\n")
                    out_file.write("# ----------------------------------------\n\n")
                    # Read and write the file content
                    with open(full_path, "r", encoding="utf-8", errors="replace") as f:
                        out_file.write(f.read())
                    out_file.write("\n")  # extra newline for clarity

def main():
    backend_output = "aggregated-backend.txt"
    frontend_output = "aggregated-frontend.txt"

    # Clear out old contents each time we run the script
    open(backend_output, "w").close()
    open(frontend_output, "w").close()

    # --- BACKEND ---
    # We only want: backend/routes, backend/migrations, backend/config
    paths_for_backend = [
        "backend/routes",
        "backend/migrations",
        "backend/config"
    ]

    for path in paths_for_backend:
        if os.path.isdir(path):
            aggregate_files(path, backend_output)
        else:
            print(f"[WARN] Missing expected folder: {path}")

    # --- FRONTEND ---
    # We only want: frontend/src
    path_for_frontend = "frontend/src"
    if os.path.isdir(path_for_frontend):
        aggregate_files(path_for_frontend, frontend_output)
    else:
        print(f"[WARN] Missing expected folder: {path_for_frontend}")

    print(f"\n[OK] Aggregation complete!")
    print(f" - Backend files collected in: {backend_output}")
    print(f" - Frontend files collected in: {frontend_output}")

if __name__ == "__main__":
    main()