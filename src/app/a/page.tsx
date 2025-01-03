// "use client";
// import React, { useState } from "react";
// import { Progress, message } from "antd";
// import SparkMD5 from "spark-md5";
// import axios from "axios";
// const BaseUrl = "http://127.0.0.1:3000/li"; // 替换为你实际的后端 URL
// const Upload = () => {
//     const [fileHash, setFileHash] = useState("");
//     const [fileName, setFileName] = useState("");
//     const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
//     const [verifyProgress, setVerifyProgress] = useState(0); // 校验进度

//     const CHUNK_SIZE = 1024 * 1024; // 1MB

//     // 文件分片
//     const createChunks = (file: File) => {
//         let cur = 0;
//         let chunks = [];
//         while (cur < file.size) {
//             const blob = file.slice(cur, cur + CHUNK_SIZE);
//             chunks.push(blob);
//             cur += CHUNK_SIZE;
//         }
//         return chunks;
//     };

//     // 计算hash值
//     const calculateHash = (chunks: Blob[]) => {
//         return new Promise((resolve) => {
//             const targets: Blob[] = [];
//             const spark = new SparkMD5.ArrayBuffer();
//             const fileReader = new FileReader();
//             chunks.forEach((chunk, index) => {
//                 if (index === 0 || index === chunks.length - 1) {
//                     targets.push(chunk);
//                 } else {
//                     targets.push(chunk.slice(0, 2)); // 前两个字节
//                     targets.push(chunk.slice(chunk.size - 2, chunk.size)); // 最后两个字节
//                     targets.push(chunk); // 完整的chunk
//                 }
//             });
//             fileReader.readAsArrayBuffer(new Blob(targets));
//             fileReader.onload = (e) => {
//                 spark.append((e.target as FileReader).result as ArrayBuffer);
//                 resolve(spark.end());
//             };
//         });
//     };

//     // 合并切片
//     const mergeRequest = (fileHash: string, fileName: string) => {
//         fetch("http://localhost:3000/merge", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE,
//             }),
//         }).then((res) => {
//             alert("合并成功");
//         });
//     };

//     // 秒传
//     const verify = (fileHash: string, fileName: string) => {
//         setVerifyProgress(0); // 初始化进度
//         return fetch("http://localhost:3000/verify", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE, // 分片大小
//             }),
//         })
//             .then((res) => res.json())
//             .then((res) => {
//                 console.log(res, "秒传");
//                 return res;
//             });
//     };

//     // 上传分片
//     const uploadChunks = async (chunks: Blob[], fileHash: string, fileName: string, existChunks: string[]) => {
//         const data = chunks.map((chunk, index) => {
//             return {
//                 fileHash: fileHash,
//                 chunkHash: fileHash + "-" + index,
//                 chunk,
//             };
//         });

//         const formDatas = data
//             .filter((item) => !existChunks.includes(item.chunkHash)) // 过滤已经上传过的分片
//             .map((item) => {
//                 const formData = new FormData();
//                 formData.append("fileHash", item.fileHash);
//                 formData.append("chunkHash", item.chunkHash);
//                 formData.append("chunk", item.chunk);
//                 return formData;
//             });

//         const max = 6; // 最大并发请求数
//         let index = 0;
//         const taskPool: any = []; // 请求池

//         while (index < formDatas.length) {
//             const task = fetch("http://localhost:3000/upload", {
//                 method: "POST",
//                 body: formDatas[index],
//             });

//             taskPool.splice(taskPool.findIndex((item: any) => item === task));
//             taskPool.push(task);

//             if (taskPool.length === max) {
//                 await Promise.race(taskPool);
//             }

//             // 更新上传进度
//             setUploadProgress(Math.floor(((index + 1) / formDatas.length) * 100));

//             index++;
//         }

//         await Promise.all(taskPool);

//         // 通知服务器合并文件
//         mergeRequest(fileHash, fileName);
//     };

//     const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = e.target.files;
//         if (!files) return;

//         setFileName(files[0].name);
//         const chunks = createChunks(files[0]);

//         // 计算文件的哈希值
//         const hash = await calculateHash(chunks);
//         setFileHash(hash as string);

//         // 校验文件是否已经上传（秒传）
//         const data = await verify(hash as string, files[0].name);
//         if (!data.data.shouldUpload) {
//             alert("秒传成功");
//             return;
//         }

//         // 上传文件分片
//         await uploadChunks(chunks, hash as string, files[0].name, data.data.existChunks);
//     };

//     return (
//         <>
//             <h1>大文件上传</h1>
//             <input type="file" onChange={handleUpload} />
//             {state.checkPercent > 0 && (
//                 <div className="uploading">
//                     <div>校验文件进度：<Progress style={{ width: 200 }} percent={state.checkPercent} /></div>
//                 </div>
//             )}
//             {state.uploadPercent > 0 && (
//                 <div className="uploading">
//                     上传文件进度：<Progress type="circle" percent={state.uploadPercent} />
//                 </div>
//             )}
//         </>
//     );
// };

// export default Upload;




// "use client";
// import React, { useState } from "react";
// import { Progress, message } from "antd";
// import SparkMD5 from "spark-md5";
// import axios from "axios";

// const BaseUrl = "http://127.0.0.1:3000/li"; // 替换为你实际的后端 URL

// const Upload = () => {
//     const [fileHash, setFileHash] = useState("");
//     const [fileName, setFileName] = useState("");
//     const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
//     const [verifyProgress, setVerifyProgress] = useState(0); // 校验进度
//     const [checkPercent, setCheckPercent] = useState(0); // 校验进度

//     const CHUNK_SIZE = 1024 * 1024; // 1MB

//     // 文件分片
//     const createChunks = (file: File) => {
//         let cur = 0;
//         let chunks = [];
//         while (cur < file.size) {
//             const blob = file.slice(cur, cur + CHUNK_SIZE);
//             chunks.push(blob);
//             cur += CHUNK_SIZE;
//         }
//         return chunks;
//     };

//     // 计算hash值
//     const calculateHash = (chunks: Blob[]) => {
//         return new Promise((resolve) => {
//             const targets: Blob[] = [];
//             const spark = new SparkMD5.ArrayBuffer();
//             const fileReader = new FileReader();
//             chunks.forEach((chunk, index) => {
//                 if (index === 0 || index === chunks.length - 1) {
//                     targets.push(chunk);
//                 } else {
//                     targets.push(chunk.slice(0, 2)); // 前两个字节
//                     targets.push(chunk.slice(chunk.size - 2, chunk.size)); // 最后两个字节
//                     targets.push(chunk); // 完整的chunk
//                 }
//             });
//             fileReader.readAsArrayBuffer(new Blob(targets));
//             fileReader.onload = (e) => {
//                 spark.append((e.target as FileReader).result as ArrayBuffer);
//                 resolve(spark.end());
//             };
//         });
//     };

//     // 合并切片
//     const mergeRequest = (fileHash: string, fileName: string) => {
//         fetch("http://localhost:3000/merge", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE,
//             }),
//         }).then((res) => {
//             alert("合并成功");
//         });
//     };

//     // 秒传
//     const verify = (fileHash: string, fileName: string) => {
//         setVerifyProgress(0); // 初始化进度
//         return fetch("http://localhost:3000/verify", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE, // 分片大小
//             }),
//         })
//             .then((res) => res.json())
//             .then((res) => {
//                 console.log(res, "秒传");
//                 return res;
//             });
//     };

//     // 上传分片
//     const uploadChunks = async (chunks: Blob[], fileHash: string, fileName: string, existChunks: string[]) => {
//         const data = chunks.map((chunk, index) => {
//             return {
//                 fileHash: fileHash,
//                 chunkHash: fileHash + "-" + index,
//                 chunk,
//             };
//         });

//         const formDatas = data
//             .filter((item) => !existChunks.includes(item.chunkHash)) // 过滤已经上传过的分片
//             .map((item) => {
//                 const formData = new FormData();
//                 formData.append("fileHash", item.fileHash);
//                 formData.append("chunkHash", item.chunkHash);
//                 formData.append("chunk", item.chunk);
//                 return formData;
//             });

//         const max = 6; // 最大并发请求数
//         let index = 0;
//         const taskPool: any = []; // 请求池

//         while (index < formDatas.length) {
//             const task = fetch("http://localhost:3000/upload", {
//                 method: "POST",
//                 body: formDatas[index],
//             });

//             taskPool.splice(taskPool.findIndex((item: any) => item === task));
//             taskPool.push(task);

//             if (taskPool.length === max) {
//                 await Promise.race(taskPool);
//             }

//             // 更新上传进度
//             setUploadProgress(Math.floor(((index + 1) / formDatas.length) * 100));

//             index++;
//         }

//         await Promise.all(taskPool);

//         // 通知服务器合并文件
//         mergeRequest(fileHash, fileName);
//     };

//     const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = e.target.files;
//         if (!files) return;

//         setFileName(files[0].name);
//         const chunks = createChunks(files[0]);

//         // 计算文件的哈希值
//         const hash = await calculateHash(chunks);
//         setFileHash(hash as string);

//         // 校验文件是否已经上传（秒传）
//         const data = await verify(hash as string, files[0].name);

//         // 处理秒传进度
//         const totalChunks = chunks.length;
//         let processedChunks = 0;
//         const interval = setInterval(() => {
//             processedChunks++;
//             setVerifyProgress(Math.floor((processedChunks / totalChunks) * 100));
//             if (processedChunks === totalChunks) clearInterval(interval);
//         }, 100);

//         if (!data.data.shouldUpload) {
//             alert("秒传成功");
//             return;
//         }

//         // 上传文件分片
//         await uploadChunks(chunks, hash as string, files[0].name, data.data.existChunks);
//     };

//     return (
//         <>
//             <h1>大文件上传</h1>
//             <input type="file" onChange={handleUpload} />
//             {verifyProgress > 0 && (
//                 <div className="uploading">
//                     <div>校验文件进度：<Progress style={{ width: 200 }} percent={verifyProgress} /></div>
//                 </div>
//             )}
//             {uploadProgress > 0 && (
//                 <div className="uploading">
//                     上传文件进度：<Progress type="circle" percent={uploadProgress} />
//                 </div>
//             )}
//         </>
//     );
// };

// export default Upload;














// "use client";
// import React, { useState } from "react";
// import { Progress, message } from "antd";
// import SparkMD5 from "spark-md5";
// import axios from "axios";

// const BaseUrl = "http://127.0.0.1:3000/li"; // 替换为你实际的后端 URL

// const Upload = () => {
//     const [fileHash, setFileHash] = useState("");
//     const [fileName, setFileName] = useState("");
//     const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
//     const [verifyProgress, setVerifyProgress] = useState(0); // 校验进度

//     const CHUNK_SIZE = 1024 * 1024; // 1MB

//     // 文件分片
//     const createChunks = (file: File) => {
//         let cur = 0;
//         let chunks = [];
//         while (cur < file.size) {
//             const blob = file.slice(cur, cur + CHUNK_SIZE);
//             chunks.push(blob);
//             cur += CHUNK_SIZE;
//         }
//         return chunks;
//     };

//     // 计算hash值
//     const calculateHash = (chunks: Blob[]) => {
//         return new Promise((resolve) => {
//             const targets: Blob[] = [];
//             const spark = new SparkMD5.ArrayBuffer();
//             const fileReader = new FileReader();
//             chunks.forEach((chunk, index) => {
//                 if (index === 0 || index === chunks.length - 1) {
//                     targets.push(chunk);
//                 } else {
//                     targets.push(chunk.slice(0, 2)); // 前两个字节
//                     targets.push(chunk.slice(chunk.size - 2, chunk.size)); // 最后两个字节
//                     targets.push(chunk); // 完整的chunk
//                 }
//             });
//             fileReader.readAsArrayBuffer(new Blob(targets));
//             fileReader.onload = (e) => {
//                 spark.append((e.target as FileReader).result as ArrayBuffer);
//                 resolve(spark.end());
//             };
//         });
//     };

//     // 合并切片
//     const mergeRequest = (fileHash: string, fileName: string) => {
//         fetch("http://localhost:3000/merge", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE,
//             }),
//         }).then((res) => {
//             // alert("合并成功");
//             console.log("合并成功");
//         });
//     };

//     // 秒传
//     const verify = (fileHash: string, fileName: string) => {
//         setVerifyProgress(0); // 初始化进度
//         return fetch("http://localhost:3000/verify", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE, // 分片大小
//             }),
//         })
//             .then((res) => res.json())
//             .then((res) => {
//                 console.log(res, "秒传");
//                 return res;
//             });
//     };

//     // 上传分片
//     const uploadChunks = async (chunks: Blob[], fileHash: string, fileName: string, existChunks: string[]) => {
//         const data = chunks.map((chunk, index) => {
//             return {
//                 fileHash: fileHash,
//                 chunkHash: fileHash + "-" + index,
//                 chunk,
//             };
//         });

//         const formDatas = data
//             .filter((item) => !existChunks.includes(item.chunkHash)) // 过滤已经上传过的分片
//             .map((item) => {
//                 const formData = new FormData();
//                 formData.append("fileHash", item.fileHash);
//                 formData.append("chunkHash", item.chunkHash);
//                 formData.append("chunk", item.chunk);
//                 return formData;
//             });

//         const max = 6; // 最大并发请求数
//         let index = 0;
//         const taskPool: any = []; // 请求池

//         while (index < formDatas.length) {
//             const task = fetch("http://localhost:3000/upload", {
//                 method: "POST",
//                 body: formDatas[index],
//             });

//             taskPool.splice(taskPool.findIndex((item: any) => item === task));
//             taskPool.push(task);

//             if (taskPool.length === max) {
//                 await Promise.race(taskPool);
//             }

//             // 更新上传进度
//             setUploadProgress(Math.floor(((index + 1) / formDatas.length) * 100));

//             index++;
//         }

//         await Promise.all(taskPool);

//         // 通知服务器合并文件
//         mergeRequest(fileHash, fileName);
//     };

//     const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = e.target.files;
//         if (!files) return;

//         setFileName(files[0].name);
//         const chunks = createChunks(files[0]);

//         // 计算文件的哈希值
//         const hash = await calculateHash(chunks);
//         setFileHash(hash as string);

//         // 校验文件是否已经上传（秒传）
//         const data = await verify(hash as string, files[0].name);

//         // 处理秒传进度
//         const totalChunks = chunks.length;
//         let processedChunks = 0;
//         const interval = setInterval(() => {
//             processedChunks++;
//             setVerifyProgress(Math.floor((processedChunks / totalChunks) * 100));
//             if (processedChunks === totalChunks) clearInterval(interval);
//         }, 100);

//         if (!data.data.shouldUpload) {
//             message.success("秒传成功");
//             return;
//         }

//         // 上传文件分片
//         await uploadChunks(chunks, hash as string, files[0].name, data.data.existChunks);
//     };

//     return (
//         <>
//             <h1>大文件上传</h1>
//             <input type="file" onChange={handleUpload} />
//             {verifyProgress > 0 && (
//                 <div className="uploading">
//                     <div>校验文件进度：<Progress style={{ width: 200 }} percent={verifyProgress} /></div>
//                 </div>
//             )}
//             {uploadProgress > 0 && (
//                 <div className="uploading">
//                     上传文件进度：<Progress type="circle" percent={uploadProgress} />
//                 </div>
//             )}
//         </>
//     );
// };

// export default Upload;





// "use client";
// import React, { useState } from "react";
// import { Progress, message } from "antd";
// import SparkMD5 from "spark-md5";
// import axios from "axios";

// const BaseUrl = "http://127.0.0.1:3000/li"; // 替换为你实际的后端 URL

// const Upload = () => {
//     const [fileHash, setFileHash] = useState("");
//     const [fileName, setFileName] = useState("");
//     const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
//     const [verifyProgress, setVerifyProgress] = useState(0); // 校验进度
//     const [isUploading, setIsUploading] = useState(false); // 是否正在上传

//     const CHUNK_SIZE = 1024 * 1024; // 1MB

//     // 文件分片
//     const createChunks = (file: File) => {
//         let cur = 0;
//         let chunks = [];
//         while (cur < file.size) {
//             const blob = file.slice(cur, cur + CHUNK_SIZE);
//             chunks.push(blob);
//             cur += CHUNK_SIZE;
//         }
//         return chunks;
//     };

//     // 计算hash值
//     const calculateHash = (chunks: Blob[]) => {
//         return new Promise((resolve) => {
//             const targets: Blob[] = [];
//             const spark = new SparkMD5.ArrayBuffer();
//             const fileReader = new FileReader();
//             chunks.forEach((chunk, index) => {
//                 if (index === 0 || index === chunks.length - 1) {
//                     targets.push(chunk);
//                 } else {
//                     targets.push(chunk.slice(0, 2)); // 前两个字节
//                     targets.push(chunk.slice(chunk.size - 2, chunk.size)); // 最后两个字节
//                     targets.push(chunk); // 完整的chunk
//                 }
//             });
//             fileReader.readAsArrayBuffer(new Blob(targets));
//             fileReader.onload = (e) => {
//                 spark.append((e.target as FileReader).result as ArrayBuffer);
//                 resolve(spark.end());
//             };
//         });
//     };

//     // 合并切片
//     const mergeRequest = (fileHash: string, fileName: string) => {
//         fetch("http://localhost:3000/merge", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE,
//             }),
//         }).then((res) => {
//             // alert("合并成功");
//             console.log("合并成功");
//         });
//     };

//     // 秒传
//     const verify = (fileHash: string, fileName: string) => {
//         setVerifyProgress(0); // 初始化进度
//         return fetch("http://localhost:3000/verify", {
//             method: "POST",
//             headers: {
//                 "Content-Type": "application/json",
//             },
//             body: JSON.stringify({
//                 fileHash,
//                 fileName,
//                 size: CHUNK_SIZE, // 分片大小
//             }),
//         })
//             .then((res) => res.json())
//             .then((res) => {
//                 console.log(res, "秒传");
//                 return res;
//             });
//     };

//     // 上传分片
//     const uploadChunks = async (chunks: Blob[], fileHash: string, fileName: string, existChunks: string[]) => {
//         setIsUploading(true); // 开始上传
//         const data = chunks.map((chunk, index) => {
//             return {
//                 fileHash: fileHash,
//                 chunkHash: fileHash + "-" + index,
//                 chunk,
//             };
//         });

//         const formDatas = data
//             .filter((item) => !existChunks.includes(item.chunkHash)) // 过滤已经上传过的分片
//             .map((item) => {
//                 const formData = new FormData();
//                 formData.append("fileHash", item.fileHash);
//                 formData.append("chunkHash", item.chunkHash);
//                 formData.append("chunk", item.chunk);
//                 return formData;
//             });

//         const max = 6; // 最大并发请求数
//         let index = 0;
//         const taskPool: any = []; // 请求池

//         while (index < formDatas.length) {
//             const task = fetch("http://localhost:3000/upload", {
//                 method: "POST",
//                 body: formDatas[index],
//             });

//             taskPool.splice(taskPool.findIndex((item: any) => item === task));
//             taskPool.push(task);

//             if (taskPool.length === max) {
//                 await Promise.race(taskPool);
//             }

//             // 更新上传进度
//             setUploadProgress(Math.floor(((index + 1) / formDatas.length) * 100));

//             index++;
//         }

//         await Promise.all(taskPool);

//         // 通知服务器合并文件
//         mergeRequest(fileHash, fileName);
//         setIsUploading(false); // 上传完成
//     };

//     const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
//         const files = e.target.files;
//         if (!files) return;

//         setFileName(files[0].name);
//         const chunks = createChunks(files[0]);

//         // 计算文件的哈希值
//         const hash = await calculateHash(chunks);
//         setFileHash(hash as string);

//         // 校验文件是否已经上传（秒传）
//         const data = await verify(hash as string, files[0].name);

//         // 处理秒传进度
//         const totalChunks = chunks.length;
//         let processedChunks = 0;
//         const interval = setInterval(() => {
//             processedChunks++;
//             setVerifyProgress(Math.floor((processedChunks / totalChunks) * 100));
//             if (processedChunks === totalChunks) clearInterval(interval);
//         }, 100);

//         if (!data.data.shouldUpload) {
//             message.success("秒传成功");
//             return;
//         }

//         // 上传文件分片
//         await uploadChunks(chunks, hash as string, files[0].name, data.data.existChunks);
//     };

//     return (
//         <>
//             <h1>大文件上传</h1>
//             <input type="file" onChange={handleUpload} />
//             {verifyProgress > 0 && !isUploading && (
//                 <div className="uploading">
//                     <div>校验文件进度：<Progress style={{ width: 200 }} percent={verifyProgress} /></div>
//                 </div>
//             )}
//             {isUploading && uploadProgress > 0 && (
//                 <div className="uploading">
//                     上传文件进度：<Progress type="circle" percent={uploadProgress} />
//                 </div>
//             )}
//         </>
//     );
// };

// export default Upload;













"use client";
import React, { useState } from "react";
import { Progress, message } from "antd";
import SparkMD5 from "spark-md5";
import axios from "axios";

const BaseUrl = "http://127.0.0.1:3000/li"; // 替换为你实际的后端 URL

const Upload = () => {
    const [fileHash, setFileHash] = useState("");
    const [fileName, setFileName] = useState("");
    const [uploadProgress, setUploadProgress] = useState(0); // 上传进度
    const [verifyProgress, setVerifyProgress] = useState(0); // 校验进度
    const [isUploading, setIsUploading] = useState(false); // 是否正在上传

    const CHUNK_SIZE = 1024 * 1024; // 1MB

    // 文件分片
    const createChunks = (file: File) => {
        let cur = 0;
        let chunks = [];
        while (cur < file.size) {
            const blob = file.slice(cur, cur + CHUNK_SIZE);
            chunks.push(blob);
            cur += CHUNK_SIZE;
        }
        return chunks;
    };

    // 计算hash值
    const calculateHash = (chunks: Blob[]) => {
        return new Promise((resolve) => {
            const targets: Blob[] = [];
            const spark = new SparkMD5.ArrayBuffer();
            const fileReader = new FileReader();
            chunks.forEach((chunk, index) => {
                if (index === 0 || index === chunks.length - 1) {
                    targets.push(chunk);
                } else {
                    targets.push(chunk.slice(0, 2)); // 前两个字节
                    targets.push(chunk.slice(chunk.size - 2, chunk.size)); // 最后两个字节
                    targets.push(chunk); // 完整的chunk
                }
            });
            fileReader.readAsArrayBuffer(new Blob(targets));
            fileReader.onload = (e) => {
                spark.append((e.target as FileReader).result as ArrayBuffer);
                resolve(spark.end());
            };
        });
    };

    // 合并切片
    const mergeRequest = (fileHash: string, fileName: string) => {
        fetch("http://localhost:3000/merge", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fileHash,
                fileName,
                size: CHUNK_SIZE,
            }),
        }).then((res) => {
            console.log("合并成功");
        });
    };

    // 秒传
    const verify = (fileHash: string, fileName: string) => {
        setVerifyProgress(0); // 初始化进度
        return fetch("http://localhost:3000/verify", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                fileHash,
                fileName,
                size: CHUNK_SIZE, // 分片大小
            }),
        })
            .then((res) => res.json())
            .then((res) => {
                console.log(res, "秒传");
                return res;
            });
    };

    // 上传分片
    const uploadChunks = async (chunks: Blob[], fileHash: string, fileName: string, existChunks: string[]) => {
        setIsUploading(true); // 开始上传
        const data = chunks.map((chunk, index) => {
            return {
                fileHash: fileHash,
                chunkHash: fileHash + "-" + index,
                chunk,
            };
        });

        const formDatas = data
            .filter((item) => !existChunks.includes(item.chunkHash)) // 过滤已经上传过的分片
            .map((item) => {
                const formData = new FormData();
                formData.append("fileHash", item.fileHash);
                formData.append("chunkHash", item.chunkHash);
                formData.append("chunk", item.chunk);
                return formData;
            });

        const max = 6; // 最大并发请求数
        let index = 0;
        const taskPool: any = []; // 请求池

        while (index < formDatas.length) {
            const task = fetch("http://localhost:3000/upload", {
                method: "POST",
                body: formDatas[index],
            });

            taskPool.splice(taskPool.findIndex((item: any) => item === task));
            taskPool.push(task);

            if (taskPool.length === max) {
                await Promise.race(taskPool);
            }

            // 更新上传进度
            setUploadProgress(Math.floor(((index + 1) / formDatas.length) * 100));

            index++;
        }

        await Promise.all(taskPool);

        // 通知服务器合并文件
        mergeRequest(fileHash, fileName);
        setIsUploading(false); // 上传完成
    };

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files) return;

        setFileName(files[0].name);
        const chunks = createChunks(files[0]);

        // 计算文件的哈希值
        const hash = await calculateHash(chunks);
        setFileHash(hash as string);

        // 校验文件是否已经上传（秒传）
        const data = await verify(hash as string, files[0].name);

        // 处理秒传进度
        const totalChunks = chunks.length;
        let processedChunks = 0;
        const interval = setInterval(() => {
            processedChunks++;
            setVerifyProgress(Math.floor((processedChunks / totalChunks) * 100));
            if (processedChunks === totalChunks) clearInterval(interval);
        }, 100);

        if (!data.data.shouldUpload) {
            message.success("秒传成功");
            return;
        }

        // 上传文件分片
        await uploadChunks(chunks, hash as string, files[0].name, data.data.existChunks);
    };

    return (
        <>
            <h1>大文件上传</h1>
            <h2>hasjdbasj</h2>
            <input type="file" onChange={handleUpload} />
            {verifyProgress > 0 && !isUploading && (
                <div className="uploading">
                    <div>校验文件进度：<Progress style={{ width: 200 }} percent={verifyProgress} /></div>
                </div>
            )}
            {isUploading && uploadProgress > 0 && (
                <div className="uploading">
                    上传文件进度：<Progress type="circle" percent={uploadProgress} />
                </div>
            )}
        </>
    );
};

export default Upload;


