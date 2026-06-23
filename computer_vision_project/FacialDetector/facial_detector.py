import cv2
import time
import os
import math
import sys
import numpy as np
from detection_controller import face_detect 
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

from HandTracker.handtracking import tracker
from VolumeControl.controller_interface import controller

# --- 1. INITIALIZE AUDIO GLOBALLY ---
# We do this OUTSIDE the loop so it only connects to Windows once.
from pycaw.pycaw import AudioUtilities
device = AudioUtilities.GetSpeakers()
volume = controller(-10.5)

# Open the default camera
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

while True:
    ret, frame = cam.read()
    if not ret:
        print("Error: Failed to grab frame.")
        break
    
    # Mirror the frame first for logical user tracking
    frame = cv2.flip(frame, 1)
    
    # Pass the frame to your hand tracker and get data back
    # Note: Using the updated flipType=False logic we discussed!
    frame, hands_list, fingercount = tracker(frame)
    
    # Calculate FPS and display it top-left
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 30), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2)
    
    
    
    dominant_emotion,x,y,age,gender = face_detect(frame)

    if dominant_emotion != "N/A":
        display_text = f"{dominant_emotion} | Age: {age} | {gender}"
        cv2.putText(frame, display_text, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (0, 255, 255), 2)

    # --- 2. THE VOLUME GESTURE LOGIC ---
    # We check if 'hands_list' (from your tracker) has at least one hand detected
    if hands_list:
        # Grab the landmark list of the FIRST hand detected
        lmist = hands_list[0]["lmList"]
        
        # 1. Get X and Y coordinates for Thumb (4) and Index (8) tips
        x1, y1 = lmist[4][0], lmist[4][1]
        x2, y2 = lmist[8][0], lmist[8][1]
        
        # Draw a line between the fingers so you can see the connection
        cv2.line(frame, (x1, y1), (x2, y2), (255, 0, 255), 3)
        
        # 2. Calculate the distance between them
        finger_distance = math.hypot(x2 - x1, y2 - y1)
        
        # 3. Map the pixel distance to a Percentage Scalar (0.0 to 1.0)
        # You may need to tweak 20 and 250 depending on your webcam distance!
        vol_scalar = np.interp(finger_distance, [20, 250], [0.0, 1.0])
        
        # 4. Set the master volume!
        volume.SetMasterVolumeLevelScalar(vol_scalar, None)
        
        # Convert scalar to a 0-100 integer for your screen UI
        vol_percentage = int(vol_scalar * 100)
        
        # Draw a Volume text label near the top center of the screen
        cv2.putText(frame, f'Vol: {vol_percentage}%', (250, 40), cv2.FONT_HERSHEY_PLAIN, 3, (255, 255, 255), 3)

    # --- 3. DISPLAY OVERLAYS ---
    # Draw a solid blue box in the bottom left corner for Finger Count
    cv2.rectangle(frame, (20, frame_height - 120), (140, frame_height - 20), (255, 0, 0), cv2.FILLED) 
    cv2.putText(frame, str(fingercount), (45, frame_height - 40), cv2.FONT_HERSHEY_PLAIN, 5, (255, 255, 255), 5) 

    # Save and display the fully assembled frame
    out.write(frame)
    cv2.imshow(window_name, frame)
    
    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
        break

cam.release()
out.release()
cv2.destroyAllWindows()