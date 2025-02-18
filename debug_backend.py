import os

def main():
    backend_dir = "backend"  # or adjust if it’s actually 'Backend'

    if not os.path.isdir(backend_dir):
        print(f"ERROR: Cannot find folder '{backend_dir}'. "
              "Are you sure it’s spelled exactly like that and in this directory?")
        return

    print(f"\nWalking through '{backend_dir}'...")

    found_any_file = False
    for root, dirs, files in os.walk(backend_dir):
        for file_name in files:
            found_any_file = True
            full_path = os.path.join(root, file_name)
            print(f"Found file: {full_path}")

            # Check for .js or .jsx
            lower_file = file_name.lower()
            if lower_file.endswith(".js"):
                print("   --> Found a JS file!")
            elif lower_file.endswith(".jsx"):
                print("   --> Found a JSX file!")
    
    if not found_any_file:
        print(f"Didn’t find any files at all under '{backend_dir}'.")

if __name__ == "__main__":
    main()