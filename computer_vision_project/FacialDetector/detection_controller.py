from deepface import DeepFace
import cv2

def face_detect(frame):
    face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)
    
    # 1. Set safe default values in case no face is detected
    dominant_emotion, x, y, age, gender = "N/A", 0, 0, "N/A", "N/A"
    
    for (x, y, w, h) in faces:
        cv2.rectangle(frame, (x, y), (x+w, y+h), (255, 0, 0), 2)
        face_img = frame[y:y+h, x:x+w]
        try:
            # 2. enforce_detection=False prevents crashes if DeepFace misses the crop
            analysis = DeepFace.analyze(face_img, actions=['age', 'gender', 'emotion'], enforce_detection=False)
            
            # DeepFace returns a list of dictionaries. Grab the first one.
            if isinstance(analysis, list):
                analysis = analysis[0]
            
            age = analysis.get('age', "N/A")
            dominant_emotion = analysis.get('dominant_emotion', "N/A")
            
            # Extract gender (Some versions return a dict, others a string)
            gender_data = analysis.get('gender', "N/A")
            if isinstance(gender_data, dict):
                gender = max(gender_data, key=gender_data.get) # Gets highest probability gender
            else:
                gender = gender_data
                
        except Exception as e:
            age = "N/A"
            gender = "N/A"
            dominant_emotion = "N/A"
            
        # Break after processing one face to keep the framerate high
        break
        
    return dominant_emotion, x, y, age, gender