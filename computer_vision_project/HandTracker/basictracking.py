import cv2
import time
import os
from handtracking import tracker

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
    
    # 1. Mirror the frame first for logical user tracking
    frame = cv2.flip(frame, 1)
    
    # 2. Pass the frame to your hand tracker and get data back
    frame, lmist, fingercount = tracker(frame)

    # 3. Calculate FPS and display it top-left
    cTime = time.time()
    fps = 1 / (cTime - pTime)
    pTime = cTime
    cv2.putText(frame, f'FPS: {int(fps)}', (10, 30), cv2.FONT_HERSHEY_PLAIN, 2, (0, 255, 0), 2)

    # 4.DISPLAY OVERLAY FIRST
    # Draw a solid blue box in the bottom left corner
    cv2.rectangle(frame, (20, frame_height - 120), (140, frame_height - 20), (255, 0, 0), cv2.FILLED) 
    # Put the total finger count text cleanly inside that box (using a larger font scale so it pops)
    cv2.putText(frame, str(fingercount), (45, frame_height - 40), cv2.FONT_HERSHEY_PLAIN, 5, (255, 255, 255), 5) 

    # 5.save and display the fully assembled frame
    out.write(frame)
    cv2.imshow(window_name, frame)
    
    # Optional print statement
    print(f"Finger Count: {fingercount}")

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

    if cv2.getWindowProperty(window_name, cv2.WND_PROP_VISIBLE) < 1:
        break

cam.release()
out.release()
cv2.destroyAllWindows()