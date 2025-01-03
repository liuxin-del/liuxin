"use client";
import React, { useRef, useEffect, useReducer, useState } from "react";
import { Button, Progress, message } from "antd";
import SparkMD5 from "spark-md5";
import axios from "axios";

const BaseUrl = "http://127.0.0.1:3000/li"; // 替换为你实际的后端 URL

const Upload = () => {
   const [fileHash,setFileHash] = useState("")
   const [fileName,setFileName] = useState("")
	// 1gb = 1024kb = 1024 * 1024b
	const CHUNK_SIZE = 1024 * 1024; //1mb
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
			// 1，第一个和最后一个切片全部参与计算
			// 2.中间的切片只计算前面两个字节、中间两个字节、最后两个字节
			const targets: Blob[] = []; //存储所有参与计算的切片
			const spark = new SparkMD5.ArrayBuffer();
			const fileReader = new FileReader();
			chunks.forEach((chunk, index) => {
				if (index === 0 || index === chunks.length - 1) {
					//1，第一个和最后一个切片全部参与计算
					targets.push(chunk);
				} else {
					// 中间的切片只计算前面两个字节、中间两个字节、最后两个字节
					targets.push(chunk.slice(0, 2)); //前面两个字节
					targets.push(chunk.slice(chunk.size - 2, chunk.size)); //中间两个字节
					targets.push(chunk); //最后两个字节
				}
			});
			fileReader.readAsArrayBuffer(new Blob(targets));
			fileReader.onload = (e) => {
				spark.append((e.target as FileReader).result as ArrayBuffer);
				resolve(spark.end())
			};
		});
	};
	const maegeRequest = (fileHash:string,fileName:string)=>{
		fetch(`http://localhost:3000/li/merge`,{
			method:"POST",
			headers:{
				"Content-Type":"application/json"
			},
			body:JSON.stringify({
				fileHash,
				fileName,
				size:CHUNK_SIZE
			})
		}).then(res=>{
			alert("合并成功")
		})
	}
   // 上传分片
   const uploadChunks = async (chunks:Blob[],fileHash:string,fileName:string)=>{
      // console.log(chunks,'chunks');
      console.log('当前的fileHash值：', fileHash);
         // 限制并发请求
         const data = chunks.map((chunk,index)=>{
            return {
               fileHash:fileHash,
               chunkHash:fileHash+"-"+index,
               chunk
            }
         })
         
         const formDatas = data.map((item)=>{
            console.log(item);
            
            const formData = new FormData()
            formData.append("fileHash",item.fileHash)
            formData.append("chunkHash",item.chunkHash)
            formData.append("chunk",item.chunk)
            return formData
         })
         // console.log(formDatas);
         
         const max = 6; //最大并发请求数
         let index = 0;
         const taskPool:any = [];//请求池
         while(index<formDatas.length){
            const task = fetch('http://localhost:3000/li/upload',{
               method:"POST",
              body:formDatas[index],
            })
            taskPool.splice(taskPool.findIndex((item:any)=>item===task))
            taskPool.push(task);
            if(taskPool.length===max){
               await Promise.race(taskPool)
            }
            index++
         }
         await Promise.all(taskPool)

		//  通知服务器合并文件
		maegeRequest(fileHash,fileName)
   }
   

	const handleUpload = async(e: Event) => {
		// console.log((e.target as HTMLInputElement).files);
		const files = (e.target as HTMLInputElement).files;
		if (!files) return;
		// 读取文件
		//   console.log(files[0]);
      setFileName(files[0].name);
		// 文件分片
		const chunks = createChunks(files[0]);
		// console.log(chunks);

		// hash计算
		const hash = await calculateHash(chunks);
      console.log(hash);
      setFileHash(hash as string);

      // 上传分片
      await uploadChunks(chunks,hash as string,files[0].name);
	};
	return (
		<>
			<h1>大文件上传</h1>
			<input onChange={(e) => handleUpload(e as any)} type="file" />
		</>
	);
};
export default Upload;
