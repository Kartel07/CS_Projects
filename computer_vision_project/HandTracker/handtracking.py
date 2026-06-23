# handtracking.py
import cvzone.HandTrackingModule as htm

# Initialize the detector
detector = htm.HandDetector(staticMode=False, maxHands=2, modelComplexity=1, detectionCon=0.75, minTrackCon=0.5)

tipIds = [4, 8, 12, 16, 20]

def tracker(frame):
    # 1. CRITICAL FIX: Add flipType=False so cvzone stops over-correcting the labels
    hands, img = detector.findHands(frame, flipType=False)
    
    total_fingers_count = 0

    for hand in hands:
        lmList = hand["lmList"]  
        hand_type = hand["type"] 
        
        fingers = []

        # 2. CRITICAL FIX: Swap the < and > signs. 
        # In a mirror view, your Right thumb points Left, and your Left thumb points Right!
        if hand_type == "Right":
            if lmList[tipIds[0]][0] < lmList[tipIds[0] - 1][0]:
                fingers.append(1)
            else:
                fingers.append(0)
        else: # Left Hand
            if lmList[tipIds[0]][0] > lmList[tipIds[0] - 1][0]:
                fingers.append(1)
            else:
                fingers.append(0)

        # 3. The 4 Fingers Logic (Up/Down Y-axis stays exactly the same)
        for id in range(1, 5):
            if lmList[tipIds[id]][1] < lmList[tipIds[id] - 2][1]:
                fingers.append(1)
            else:
                fingers.append(0)
        
        total_fingers_count += fingers.count(1)

    return img, hands, total_fingers_count