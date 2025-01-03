"use client";
import React, { useRef, useEffect, useReducer, ChangeEvent } from 'react';
import { Button, Progress, message } from 'antd';
import SparkMD5 from 'spark-md5';
import axios from 'axios';
// Base URL for API requests
const BaseUrl = 'http://127.0.0.1:3000';
// Initial state for the reducer
const initialState = { checkPercent: 0, uploadPercent: 0 };
// Reducer function to handle state updates
type State = {
   checkPercent: number;
   uploadPercent: number;
};

type Action =
   | { type: 'check'; checkPercent: number }
   | { type: 'upload'; uploadPercent: number }
   | { type: 'reset' };

function reducer(state: State, action: Action): State {
   switch (action.type) {
      case 'check':
         return { ...state, checkPercent: action.checkPercent };
      case 'upload':
         return { ...state, uploadPercent: action.uploadPercent };
      case 'reset':
         return initialState;
      default:
         return state;
   }
}

// Type for the file input event handler
type FileInputEvent = ChangeEvent<HTMLInputElement>;
const Upload = () => {
   const [state, dispatch] = useReducer(reducer, initialState);
   const inputRef = useRef<HTMLInputElement | null>(null);
   const chunkSize = 5 * 1024 * 1024; // Chunk size: 5MB  
   // 计算文件的MD5 hash值
   const md5File = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
         const blobSlice = File.prototype.slice || File.prototype.mozSlice || File.prototype.webkitSlice; //
         const spark = new SparkMD5.ArrayBuffer();//创建sparkMD5对象
         const fileReader = new FileReader();//创建FileReader对象
         let currentChunk = 0;//当前读取的块
         const totalChunks = Math.ceil(file.size / chunkSize);//总块数
         fileReader.onload = (e) => {//读取块完成
            if (e.target?.result) {//如果读取结果存在
               spark.append(e.target.result);//将读取结果添加到sparkMD5对象中
               currentChunk++;//当前块数加1
               dispatch({ type: 'check', checkPercent: Math.round((currentChunk / totalChunks) * 100) });//更新进度
               if (currentChunk < totalChunks) {//如果当前块数小于总块数
                  loadNext();//继续读取下一块
               } else {
                  resolve(spark.end());//读取完成，返回MD5值
               }
            } else {
               reject('FileReader error');
            }
         };

         const loadNext = () => {
            const start = currentChunk * chunkSize;//当前块的起始位置
            const end = Math.min(start + chunkSize, file.size);//当前块的结束位置
            fileReader.readAsArrayBuffer(blobSlice.call(file, start, end));//读取当前块
         };

         loadNext();
      });
   };

   // 通过文件名和文件MD5值检查文件是否已经上传
   const checkFileMD5 = (fileName: string, fileMd5Value: string) => {
      const url = `${BaseUrl}/largeFileUpload/check/file?fileName=${fileName}&fileMd5Value=${fileMd5Value}`;
      return axios.get(url);
   };

   // 文件上传
   const upload = ({ i, file, fileMd5Value }: { i: number, file: File, fileMd5Value: string }): Promise<void> => {
      const form = new FormData();// 创建一个FormData对象
      const chunk = file.slice(i * chunkSize, (i + 1) * chunkSize);//获取当前块的文件数据
      form.append('data', chunk);//将文件数据添加到FormData对象中
      form.append('total', Math.ceil(file.size / chunkSize).toString());//将文件总块数添加到FormData对象中
      form.append('index', i.toString());//将当前块索引添加到FormData对象中
      form.append('fileMd5Value', fileMd5Value);//将文件MD5值添加到FormData对象中
      return axios.post(`${BaseUrl}/largeFileUpload/upload`, form).then(({ data }) => {
         if (data.stat) {
            const uploadPercent = Math.ceil(((i + 1) / Math.ceil(file.size / chunkSize)) * 100);//计算上传进度
            dispatch({ type: 'upload', uploadPercent });//更新上传进度
         }
      });
   };

   //一个用于分块上传文件的函数
   const checkAndUploadChunk = async (file: File, fileMd5Value: string, chunkList: string[]) => {
      const totalChunks = Math.ceil(file.size / chunkSize);//计算文件的总块数
      const requestList: Promise<void>[] = [];//创建一个空数组来存储请求   
      for (let i = 0; i < totalChunks; i++) {//遍历每个块
         if (!chunkList.includes(i.toString())) {//如果块还没有被上传
            requestList.push(upload({ i, file, fileMd5Value }));//将上传请求添加到请求列表中
         }
      }
      if (requestList.length) {//如果请求列表不为空
         await Promise.all(requestList);//等待所有请求完成
         dispatch({ type: 'upload', uploadPercent: 100 }); //上传完成
   };
}

   // 用于检查文件是否已经上传过
   const responseChange = async (file: File) => {
      const fileMd5Value = await md5File(file);//计算MD5的值
      const { data } = await checkFileMD5(file.name, fileMd5Value);//检查文件是否被上传了
      if (data?.file) {//对文件的一个判断(如果文件存在就是秒传，不存在的话就对文件进行切片,上传切片)
         alert('文件已秒传');
         return;
      }
      await checkAndUploadChunk(file, fileMd5Value, data.chunkList);
      notifyServer(file, fileMd5Value);
   }

    //成功之后通知服务器（调用合并的接口）
   const notifyServer = (file: File, fileMd5Value: string) => {
      const url = `${BaseUrl}/largeFileUpload/merge?md5=${fileMd5Value}&fileName=${file.name}&size=${file.size}`;
      axios.get(url).then(({ data }) => {
         if (data.stat) {
            message.success('上传成功');
         } else {
            message.error('上传失败');
         }
      });
   };

 
   //用于在组件加载时添加事件监听器，并在组件卸载时清理事件监听器。
   // 它监听一个 <input> 元素的 change 事件，触发文件上传的处理逻辑
   useEffect(() => {
      const changeFile = ({ target }: FileInputEvent) => {
         dispatch({ type: 'reset' });
         const file = target.files?.[0];
         if (file) {
            responseChange(file);
         }
      };
      document.addEventListener("change", changeFile);
      return () => {
         document.removeEventListener("change", changeFile);
      };
   }, []);

   return (
      <div className="wrap">
         <div className="upload">
            <input   ref={inputRef}   type="file"  id="file" />
            <button onClick={() => inputRef.current?.click()}>上传</button>
         </div>
         {state.checkPercent > 0 && (
            <div className="uploading">
               <div>校验文件进度：<Progress style={{ width: 200 }} percent={state.checkPercent} /></div>
            </div>
         )}
         {state.uploadPercent > 0 && (
            <div className="uploading">
               上传文件进度：<Progress type="circle" percent={state.uploadPercent} />
            </div>
         )}
      </div>
   );
};

export default Upload;
