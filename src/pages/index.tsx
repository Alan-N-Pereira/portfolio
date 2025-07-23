'use client';

import {useEffect, useRef} from 'react';
import type Phaser from 'phaser'

export default function HomePage() {
  const gameRef = useRef<Phaser.Game | null>(null)

  useEffect(()=> {
    let isMounted = true;

    const loadGame = async()=>{
      const{ default: Game}= await import('@/game/Game')
      if(isMounted){
        gameRef.current = new Game()
      }
    }

    loadGame();

    //Cleanup Phaser on unmount 
    return ()=>{
      isMounted = false;
      if(gameRef.current){
        gameRef.current.destroy(true);
        gameRef.current = null
      }
    }
  }, []);

  return(
    <div id="phaser-container" style={{width:'100vw',height: '100vh', margin: 0, padding: 0, overflow: 'hidden'}}/>
  );
}