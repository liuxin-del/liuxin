"use client"
import React,{useState} from 'react'

export default function Page() {
  const [str,setStr]=useState<string>("hi")
  return (
    <div className='aa' onClick={()=>{setStr('hello')}}>{str}</div>
  )
}
