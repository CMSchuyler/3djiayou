// 导入所需模块
import fs from 'fs';
import path from 'path';
import https from 'https';
import http from 'http';
import { fileURLToPath } from 'url';
import xlsx from 'xlsx';

// 获取当前文件和目录名
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 创建下载目录
const downloadDir = path.join(__dirname, '..', 'public', 'downloaded_images');
if (!fs.existsSync(downloadDir)) {
  fs.mkdirSync(downloadDir, { recursive: true });
  console.log(`创建目录: ${downloadDir}`);
}

// 读取Excel文件
function readExcel() {
  try {
    const excelPath = path.join(__dirname, '..', 'public', '佳邮数据.xlsx');
    const workbook = xlsx.readFile(excelPath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(worksheet);
    return data;
  } catch (error) {
    console.error('读取Excel文件失败:', error);
    return [];
  }
}

// 提取图片链接
function extractImageLinks(data) {
  const imageEntries = [];
  
  data.forEach((row, index) => {
    const imageLinksCell = row['图片链接'] || '';
    const stampName = row['邮票名称'] || `Item ${index + 1}`;
    
    if (typeof imageLinksCell === 'string') {
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
}

// 下载单个图片
function downloadImage(url, filePath) {
  return new Promise((resolve, reject) => {
    // 确定使用http还是https
    const client = url.startsWith('https') ? https : http;
    
    const request = client.get(url, (response) => {
      // 检查响应状态码
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(filePath);
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`成功下载: ${path.basename(filePath)}`);
          resolve(filePath);
        });
      } else if (response.statusCode === 301 || response.statusCode === 302) {
        // 处理重定向
        console.log(`重定向: ${url} -> ${response.headers.location}`);
        downloadImage(response.headers.location, filePath)
          .then(resolve)
          .catch(reject);
      } else {
        console.error(`下载失败 ${url}, 状态码: ${response.statusCode}`);
        reject(new Error(`状态码: ${response.statusCode}`));
      }
    });
    
    request.on('error', (err) => {
      console.error(`请求错误 ${url}: ${err.message}`);
      reject(err);
    });
    
    // 设置超时
    request.setTimeout(10000, () => {
      request.abort();
      reject(new Error('请求超时'));
    });
  });
}

// 生成安全的文件名
function getSafeFileName(url, index) {
  const fileName = url.split('/').pop();
  return fileName ? fileName.replace(/[^a-zA-Z0-9.]/g, '_') : `image_${index}.jpg`;
}

// 主函数
async function main() {
  console.log('开始下载图片...');
  
  // 读取Excel文件
  const data = readExcel();
  if (data.length === 0) {
    console.error('Excel数据为空，无法继续。');
    return;
  }
  
  // 提取图片链接
  const imageEntries = extractImageLinks(data);
  console.log(`从Excel中提取了 ${imageEntries.length} 个图片链接`);
  
  // 下载图片
  const results = { success: 0, failed: 0 };
  const downloadPromises = imageEntries.map(async (entry) => {
    const safeFileName = getSafeFileName(entry.url, entry.index);
    const filePath = path.join(downloadDir, safeFileName);
    
    try {
      await downloadImage(entry.url, filePath);
      results.success++;
      return { ...entry, localPath: `/downloaded_images/${safeFileName}` };
    } catch (error) {
      console.error(`下载失败 ${entry.url}: ${error.message}`);
      results.failed++;
      return { ...entry, error: error.message };
    }
  });
  
  // 等待所有下载完成
  const downloadedEntries = await Promise.all(downloadPromises);
  
  // 生成映射文件
  const mapping = downloadedEntries.map(entry => ({
    originalUrl: entry.url,
    localPath: entry.localPath || null,
    title: entry.title,
    index: entry.index,
    success: !entry.error
  }));
  
  fs.writeFileSync(
    path.join(downloadDir, 'image_mapping.json'), 
    JSON.stringify(mapping, null, 2)
  );
  
  console.log('\n下载完成:');
  console.log(`成功: ${results.success} 个图片`);
  console.log(`失败: ${results.failed} 个图片`);
  console.log(`映射文件已保存至: ${path.join(downloadDir, 'image_mapping.json')}`);
}

// 执行主函数
main().catch(error => {
  console.error('程序执行出错:', error);
}); 