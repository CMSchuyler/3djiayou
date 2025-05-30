import * as XLSX from 'xlsx';

// 从Excel中提取所有图片链接
export const extractImageLinks = async () => {
  try {
    // 使用fetch获取Excel文件
    const response = await fetch('/佳邮数据.xlsx');
    const arrayBuffer = await response.arrayBuffer();
    
    // 读取Excel文件
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });
    
    // 获取第一个工作表
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    
    // 将工作表转换为JSON对象
    const data = XLSX.utils.sheet_to_json(worksheet);
    
    // 收集所有图片链接和相应的邮票名称
    const imageEntries = [];
    
    data.forEach((row, index) => {
      // 检查行中是否有"图片链接"列
      const imageLinksCell = row['图片链接'] || '';
      const stampName = row['邮票名称'] || `Item ${index + 1}`;
      
      // 如果单元格包含多个链接，提取第一个
      if (typeof imageLinksCell === 'string') {
        // 检查是否有http链接模式
        const links = imageLinksCell.match(/(https?:\/\/[^\s,]+)/g) || [];
        if (links.length > 0) {
          const firstLink = links[0];
          imageEntries.push({
            url: firstLink,
            title: stampName,
            index
          });
        }
      }
    });
    
    return imageEntries;
  } catch (error) {
    console.error('读取Excel文件失败:', error);
    return [];
  }
};

// 将图片链接转换为本地路径格式
export const getLocalImagePath = (url, index) => {
  // 提取文件名
  const fileName = url.split('/').pop();
  // 生成安全的文件名
  const safeFileName = fileName ? fileName.replace(/[^a-zA-Z0-9.]/g, '_') : `image_${index}.jpg`;
  // 返回本地路径
  return `/downloaded_images/${safeFileName}`;
};

// 构建图片信息对象数组，与Frame组件兼容
export const buildImageData = (imageEntries) => {
  // 本地备用图片数组
  const localBackupImages = [
    '/photos/mmexport1689910736872.jpg',
    '/photos/3M5A9169.png',
    '/photos/3M5A8385.png',
    '/photos/3M5A7916-1k.png',
    '/photos/mmexport1689910070987.jpg',
    '/photos/mmexport1689910425322.jpg',
    '/photos/mmexport1689910497995.jpg',
    '/photos/mmexport1689910576643.jpg'
  ];
  
  return imageEntries.map((entry, i) => {
    const backupIndex = i % localBackupImages.length;
    
    return {
      url: getLocalImagePath(entry.url, entry.index),
      backupUrl: localBackupImages[backupIndex], // 备用图片
      title: entry.title,
      position: i < 22 
        ? [-15, 7, 50 + i * 50] // 左侧
        : [15, 7, 75 + (i - 22) * 50], // 右侧
      rotation: i < 22 
        ? [0, Math.PI / 12, 0] // 向右倾斜
        : [0, -Math.PI / 12, 0], // 向左倾斜
    };
  });
}; 