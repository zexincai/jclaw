// 加载图片（处理跨域）
function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.src = url;
    img.onload = () => resolve(img);
    img.onerror = (e) => reject(e);
  });
}

function calculateGrid(count) {
  // 微信2024统一布局规则
  const rules = [
    [1, 1], // 0-1
    [1, 1], [1, 2], // 1-2
    [2, 2], [2, 2], [2, 3], // 3-5
    [3, 2], [3, 3], [3, 3], [3, 3] // 6-9
  ];
  return rules[count] || [3, 3];
}

function calculatePosition(index, rows, cols, canvasWidth, canvasHeight, count) {
  const spacing = 2;
  const cellSizer = (total, num) => ({
    size: (total - (num - 1) * spacing) / num,
    gap: spacing
  });

  // 3图特殊处理（2行）
  if (count === 3) {
    const { size: w } = cellSizer(canvasWidth, 2);
    const { size: h } = cellSizer(canvasHeight, 2);
    if (index === 0) {
      return { x: 0, y: 0, cellWidth: canvasWidth, cellHeight: h };
    }
    return {
      x: (index - 1) * (w + spacing),
      y: h + spacing,
      cellWidth: w,
      cellHeight: h
    };
  }

  // 5图精确布局（两行三列）
  if (count === 5) {
    const cellSize = (canvasWidth - 2 * spacing) / 3; // 统一单元格尺寸
    const rowHeight = (canvasHeight - spacing) / 2;

    if (index < 2) {
      return {
        x: index * (cellSize + spacing) + (cellSize - spacing) / 2, // 水平居中排列
        y: 0,
        cellWidth: cellSize,
        cellHeight: rowHeight
      };
    }
    return {
      x: (index - 2) * (cellSize + spacing),
      y: rowHeight + spacing,
      cellWidth: cellSize,
      cellHeight: rowHeight
    };
  }

  // 7图特殊处理（三行三列）
  if (count === 7) {
    const cellSize = (canvasWidth - 2 * spacing) / 3;
    const rowHeight = (canvasHeight - 2 * spacing) / 3;

    // 首行单图（跨3列）
    if (index === 0) {
      return {
        x: 0,
        y: 0,
        cellWidth: canvasWidth,
        cellHeight: rowHeight
      };
    }

    // 后续图片按3列布局
    const adjustedIndex = index - 1;
    return {
      x: (adjustedIndex % 3) * (cellSize + spacing),
      y: rowHeight + spacing + Math.floor(adjustedIndex / 3) * (rowHeight + spacing),
      cellWidth: cellSize,
      cellHeight: rowHeight
    };
  }
  // 8图特殊处理
  if (count === 8) {
    const rowHeight = (canvasHeight - 2 * spacing) / 3;

    // 首行2图居中
    if (index < 2) {
      const { size: w } = cellSizer(canvasWidth, 3);
      return {
        x: (index * (w + spacing)) + w / 2, // 居中排列
        y: 0,
        cellWidth: w,
        cellHeight: rowHeight
      };
    }

    // 后续6图按3列布局
    const { size: w } = cellSizer(canvasWidth, 3);
    const adjustedIndex = index - 2;
    return {
      x: (adjustedIndex % 3) * (w + spacing),
      y: rowHeight + spacing + Math.floor(adjustedIndex / 3) * (rowHeight + spacing),
      cellWidth: w,
      cellHeight: rowHeight
    };
  }

  // 通用网格布局（适用于4,6,8,9图）
  const { size: cellW } = cellSizer(canvasWidth, cols);
  const { size: cellH } = cellSizer(canvasHeight, rows);

  const row = Math.floor(index / cols);
  const col = index % cols;
  const validCols = Math.min(count - row * cols, cols);
  const offsetX = validCols < cols ? (cols - validCols) * (cellW + spacing) / 2 : 0;

  return {
    x: col * (cellW + spacing) + offsetX,
    y: row * (cellH + spacing),
    cellWidth: cellW,
    cellHeight: cellH
  };
}

export async function getGroupAvg(urls) {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 400;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, 400, 400);

  const images = await Promise.all(urls.slice(0, 9).map(loadImage));
  const count = images.length;
  const [rows, cols] = calculateGrid(count);

  images.forEach((img, index) => {
    const { x, y, cellWidth, cellHeight } = calculatePosition(index, rows, cols, 400, 400, count);

    // 按比例缩放图片
    const imgRatio = img.width / img.height;
    const [dw, dh] = imgRatio > cellWidth / cellHeight
      ? [cellWidth, cellWidth / imgRatio]
      : [cellHeight * imgRatio, cellHeight];

    // 居中绘制
    ctx.drawImage(img,
      x + (cellWidth - dw) / 2,
      y + (cellHeight - dh) / 2,
      dw, dh
    );
  });

  return canvas.toDataURL("image/png");
}
