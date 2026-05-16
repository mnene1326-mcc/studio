"use client"

/**
 * @fileOverview Tencent RTC (TRTC) Service for Voice Party Rooms.
 */

import TRTC from 'trtc-js-sdk';

export interface TRTCConfig {
  sdkAppId: number;
  userId: string;
  userSig: string;
}

class TRTCService {
  private client: any = null;
  private localStream: any = null;
  private isJoined = false;

  async init(config: TRTCConfig) {
    if (this.client) return;

    try {
      this.client = TRTC.createClient({
        mode: 'rtc',
        sdkAppId: config.sdkAppId,
        userId: config.userId,
        userSig: config.userSig,
      });

      // Handle remote streams
      this.client.on('stream-added', (event: any) => {
        const remoteStream = event.stream;
        this.client.subscribe(remoteStream);
      });

      this.client.on('stream-subscribed', (event: any) => {
        const remoteStream = event.stream;
        // In a real app, you'd append an <audio> element to the DOM here
        remoteStream.play('remote-audio-container'); 
      });
      
      console.log('TRTC Client Initialized');
    } catch (err) {
      console.error('TRTC Init Failed:', err);
    }
  }

  async join(roomId: number) {
    if (!this.client || this.isJoined) return;

    try {
      await this.client.join({ roomId });
      this.isJoined = true;

      // Create and publish local voice stream
      this.localStream = TRTC.createStream({
        userId: this.client.getUserId(),
        audio: true,
        video: false,
      });

      await this.localStream.initialize();
      await this.client.publish(this.localStream);
      
      console.log('Joined and published to room:', roomId);
    } catch (error) {
      console.error('Failed to join TRTC room:', error);
    }
  }

  async leave() {
    if (!this.client || !this.isJoined) return;

    try {
      if (this.localStream) {
        await this.client.unpublish(this.localStream);
        this.localStream.close();
        this.localStream = null;
      }
      await this.client.leave();
      this.isJoined = false;
      console.log('Left TRTC room');
    } catch (error) {
      console.error('Failed to leave TRTC room:', error);
    }
  }

  toggleMic(enabled: boolean) {
    if (this.localStream) {
      if (enabled) {
        this.localStream.unmuteAudio();
      } else {
        this.localStream.muteAudio();
      }
    }
  }
}

export const trtcService = new TRTCService();
