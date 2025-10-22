# scripts/utils_features.py
import numpy as np

IDX_WRIST = 0
IDX_MID_MCP = 9

def normalize_landmarks(lm_xyz, flip_if_right=False, handedness_label=None):
    """lm_xyz: shape (21,3), values in [0,1]相対座標（MediaPipe出力）
       flip_if_right: Trueなら右手を左右反転して片手系に統一
       handedness_label: 'Left' or 'Right'（MediaPipeのhandednessカテゴリ）
    """
    pts = np.array(lm_xyz, dtype=np.float32)  # 21x3
    # 左右統一（画像座標系でxを反転）
    if flip_if_right and handedness_label == "Right":
        pts[:,0] = 1.0 - pts[:,0]

    # 平行移動除去（手首を原点へ）
    wrist = pts[IDX_WRIST].copy()
    pts -= wrist

    # スケール正規化（手首→中指MCP距離）
    scale = np.linalg.norm(pts[IDX_MID_MCP]) + 1e-6
    pts /= scale
    return pts.reshape(-1)  # 63次元
