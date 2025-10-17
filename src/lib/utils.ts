function calculateIntersectionOverUnion(
  box1: [number, number, number, number],
  box2: [number, number, number, number]
): number {
  const [cx1, cy1, w1, h1] = box1;
  const [cx2, cy2, w2, h2] = box2;

  // Convert center format to corner format
  const x1_min = cx1 - w1 / 2,
    y1_min = cy1 - h1 / 2;
  const x1_max = cx1 + w1 / 2,
    y1_max = cy1 + h1 / 2;
  const x2_min = cx2 - w2 / 2,
    y2_min = cy2 - h2 / 2;
  const x2_max = cx2 + w2 / 2,
    y2_max = cy2 + h2 / 2;

  // Calculate intersection
  const intersect_xmin = Math.max(x1_min, x2_min);
  const intersect_ymin = Math.max(y1_min, y2_min);
  const intersect_xmax = Math.min(x1_max, x2_max);
  const intersect_ymax = Math.min(y1_max, y2_max);

  const intersect_w = Math.max(0, intersect_xmax - intersect_xmin);
  const intersect_h = Math.max(0, intersect_ymax - intersect_ymin);
  const intersect_area = intersect_w * intersect_h;

  // Calculate union
  const box1_area = w1 * h1;
  const box2_area = w2 * h2;
  const union_area = box1_area + box2_area - intersect_area;

  return union_area > 0 ? intersect_area / union_area : 0;
}

export function applyNonMaximumSuppression(
  detections: Array<{
    box: [number, number, number, number];
    classId: number;
    confidence: number;
  }>,
  iouThreshold: number
): Array<{
  box: [number, number, number, number];
  classId: number;
  confidence: number;
}> {
  if (detections.length === 0) return [];

  const sorted = detections.slice().sort((a, b) => b.confidence - a.confidence);
  const keep: typeof detections = [];

  while (sorted.length > 0) {
    const current = sorted.shift()!;
    keep.push(current);

    // Remove boxes with high IoU with current box and same class
    for (let i = sorted.length - 1; i >= 0; i--) {
      if (sorted[i].classId === current.classId) {
        const iou = calculateIntersectionOverUnion(current.box, sorted[i].box);
        if (iou > iouThreshold) {
          sorted.splice(i, 1);
        }
      }
    }
  }

  return keep;
}
