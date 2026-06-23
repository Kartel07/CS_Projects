import csv
import cv2
import time
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from HandTracker.handtracking import tracker
from Datasets.option_selector import select_option

# Open the camera
cam = cv2.VideoCapture(0)
pTime = 0

if not cam.isOpened():
    print("Error: Could not open camera.")
    exit()

frame_width = int(cam.get(cv2.CAP_PROP_FRAME_WIDTH))
frame_height = int(cam.get(cv2.CAP_PROP_FRAME_HEIGHT))

fourcc = cv2.VideoWriter_fourcc(*'mp4v')
out = cv2.VideoWriter('output.mp4', fourcc, 20.0, (frame_width, frame_height))

window_name = 'Camera View'

label = 0 
i = 0 
print(f"Ready to collect data for Symbol ID: {label}. Press 's' to capture frames.")

while True:
    ret, frame = cam.read()
    if not ret:
        print("Error: Failed to grab frame.")
        break
    
    # Mirror the frame first for logical user tracking
    frame = cv2.flip(frame, 1)
    
    # Pass the frame to your hand tracker and get data back
    frame, hands_list, fingercount = tracker(frame)
    
    # Read the keyboard input ONCE per frame
    key = cv2.waitKey(1) & 0xFF

    if hands_list:
        lmList = hands_list[0]["lmList"]
        
        # Save to a CSV file when you press 's'
        if key == ord('s'):
            # Flatten the 21 points into a 1D array of 63 numbers
            flat_data = []
            for point in lmList:
                flat_data.extend([point[0], point[1], point[2]])
                
            # Add the current label
            flat_data.append(label)
            
            with open('sign_language_data.csv', mode='a', newline='') as f:
                writer = csv.writer(f)
                writer.writerow(flat_data)
                
            i += 1
            print(f"Saved Frame! {i}/100 for Symbol ID: {label}")
            
            # Check if we hit the 100 image limit
            if i >= 100:
                # Trigger the popup (freezes the OpenCV feed automatically)
                response = select_option(current_label=label)
                
                if response: # User clicked 'Yes' (Continue)
                    label += 1  # Increment the label for the next sign!
                    i = 0       # Reset the image counter back to 0
                    print(f"\nSwapped to Symbol ID: {label}")
                    print("Position your hand and press 's' to start recording.")
                else: # User clicked 'No' (Exit)
                    print("Saving progress and exiting...")
                    break

    # Calculate FPS and display it top-left
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 30), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2)

    # DISPLAY OVERLAYS
    cv2.rectangle(frame, (20, frame_height - 120), (140, frame_height - 20), (255, 0, 0), cv2.FILLED) 
    cv2.putText(frame, str(fingercount), (45, frame_height - 40), cv2.FONT_HERSHEY_PLAIN, 5, (255, 255, 255), 5) 

    out.write(frame)
    cv2.imshow(window_name, frame)

    if key == ord('q') or cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
        break

cam.release()
out.release()
cv2.destroyAllWindows()