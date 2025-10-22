# scripts/collect_data.py
import csv, cv2, numpy as np, mediapipe as mp
from mediapipe.tasks import python as mp_python
from mediapipe.tasks.python import vision
from utils_features import normalize_landmarks

LABELS = {6: "other", 0: "good", 1: "one", 2: "two", 3: "three", 4: "four", 5: "five"}
OUT_CSV = "data/hand_gestures.csv"
NUM_FEATURES = 63  # 21点x3座標
hands_model_path = (
    "./weights/hand_landmarker.task"  # Google公式からダウンロードしてください。
)

# CSVヘッダ
try:
    with open(OUT_CSV, "x", newline="") as f:
        w = csv.writer(f)
        w.writerow([f"f{i}" for i in range(NUM_FEATURES)] + ["label"])
except FileExistsError:
    pass

base_options = mp_python.BaseOptions(model_asset_path=hands_model_path)  # 内蔵モデル
options = vision.HandLandmarkerOptions(
    base_options=base_options,
    num_hands=1,
    min_hand_detection_confidence=0.6,
    min_hand_presence_confidence=0.6,
    min_tracking_confidence=0.6,
)
detector = vision.HandLandmarker.create_from_options(options)

cap = cv2.VideoCapture(0)
cur_label = 0
# 操作説明。エラーになるため、0からの連番である必要がある。
print(
    "Controls: [0]=good, [1]=one, [2]=two,[3]=three,[4]=four,[5]=five, [6]=other, [s]=save, [q]=quit"
)

while True:
    ok, frame = cap.read()
    if not ok:
        break
    rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
    mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb)
    result = detector.detect(mp_image)

    # 描画
    if result.hand_landmarks:
        lm = result.hand_landmarks[0]
        for p in lm:
            cv2.circle(
                frame,
                (int(p.x * frame.shape[1]), int(p.y * frame.shape[0])),
                3,
                (0, 255, 0),
                -1,
            )

    cv2.putText(
        frame,
        f"label:{cur_label}({LABELS[cur_label]})  s=save  q=quit",
        (10, 30),
        cv2.FONT_HERSHEY_SIMPLEX,
        0.8,
        (255, 255, 255),
        2,
    )
    cv2.imshow("collect", frame)
    key = cv2.waitKey(1) & 0xFF

    if key == ord("q"):
        break
    if key in [ord("0"), ord("1"), ord("2"), ord("3"), ord("4"), ord("5"), ord("9")]:
        cur_label = int(chr(key))
    if key == ord("s") and result.hand_landmarks:
        lm = result.hand_landmarks[0]
        handedness = (
            result.handedness[0][0].category_name if result.handedness else None
        )
        pts = [[p.x, p.y, p.z] for p in lm]
        feats = normalize_landmarks(
            pts, flip_if_right=True, handedness_label=handedness
        )
        with open(OUT_CSV, "a", newline="") as f:
            csv.writer(f).writerow(list(map(float, feats)) + [cur_label])
        print("saved:", LABELS[cur_label])

cap.release()
cv2.destroyAllWindows()
