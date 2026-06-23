import tkinter as tk
from tkinter import messagebox

def select_option(current_label, batch_size=100):
    # 1. Create and hide the root window so we ONLY see the popup
    root = tk.Tk()
    root.withdraw()
    
    # 2. Trigger the popup
    response = messagebox.askyesno(
        title="Batch Complete!",
        message=f"Successfully captured {batch_size} images for Symbol ID: {current_label}.\n\n"
                f"Click 'Yes' to proceed to the next symbol.\n"
                f"Click 'No' to save progress and exit."
    )
    
    # 3. Destroy the root window to free up memory before returning to OpenCV
    root.destroy()
    
    # Returns True if 'Yes', False if 'No'
    return response