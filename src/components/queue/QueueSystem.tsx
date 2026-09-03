import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@mantine/core';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Queue.css';
import acceptSound from '../../assets/alert.mp3';

type QueueState = 'select' | 'verification' | 'position' | 'accept' | 'ready';
type QueueType = 'regular' | 'police' | 'ems';

const QueueSystem: React.FC = () => {
  const [queueState, setQueueState] = useState<QueueState>('accept');
  const [selectedQueue, setSelectedQueue] = useState<QueueType | null>(null);
  const [timeLeft, setTimeLeft] = useState(26);
  const [joinTime, setJoinTime] = useState(7);
  const [position, setPosition] = useState(1);
  const [queueLength, setQueueLength] = useState(1);
  const [timeInQueue, setTimeInQueue] = useState(0);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const getGradient = () => {
    if (queueState === 'accept' || queueState === 'ready') {
      return 'linear-gradient(135deg, #1a1a1a, rgba(134, 133, 239, 0.7))';
    }
    return null;
  };

  const handleGoBack = () => {
    navigate('/');
  };

  useEffect(() => {
    if (queueState === 'accept') {
      if (!audioRef.current) {
        const audio = new Audio(acceptSound);
        audio.loop = true;
        audioRef.current = audio;
      }
      audioRef.current.play();

      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            if (audioRef.current) {
              audioRef.current.pause();
              audioRef.current = null;
            }
            setQueueState('select');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => {
        clearInterval(timer);
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }
  }, [queueState]);

  useEffect(() => {
    if (queueState === 'ready') {
      const timer = setInterval(() => {
        setJoinTime((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 60000);
      return () => clearInterval(timer);
    }
  }, [queueState]);

  useEffect(() => {
    if (queueState === 'position') {
      const timer = setInterval(() => {
        setTimeInQueue((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [queueState]);

  return (
    <div className="queue-container">
      <Helmet>
        <title>Server Queue | Synthwave Roleplay</title>
        <meta name="description" content="Join the Synthwave Roleplay server queue and track your position in real-time." />
        <link rel="canonical" href="https://synthwave.in/queue" />
      </Helmet>
      <div className="queue-card"
        style={{
          background: getGradient() || '#121212',
        }}>
        <div className="queue-border-overlay" />
        <div className="queue-content">
          <h1 className="queue-title">
            {queueState === 'select' && 'Select Queue Type'}
            {queueState === 'position' && ''}
            {queueState === 'accept' && ''}
            {queueState === 'ready' && ''}
          </h1>
          {queueState === 'select' && (
            <div>
              <div
                onClick={() => setQueueState('position')}
                className="queue-option">
              </div>
              <div className="queue-buttons">
                <Button onClick={handleGoBack} color="red" variant="light">
                  Go Back
                </Button>
              </div>
            </div>
          )}
          {queueState === 'position' && (
            <div>
              <div className="queue-label">CURRENT POSITION</div>
              <div className="queue-position">
                <span>{position}</span>
                <span className="divider">/</span>
                <span>{queueLength}</span>
              </div>
              <div className="queue-timer">
                <Clock className="clock-icon" />
                <span>TIME IN QUEUE</span>
                <div>{timeInQueue} seconds</div>
              </div>
              <Button
                color="red"
                variant="light"
                onClick={() => setQueueState('select')}
              >
                Leave Queue
              </Button>
            </div>
          )}
          {queueState === 'accept' && (
            <div>
              <div className="queue-timer">
                <Clock className="clock-icon" />
                <span>TIME TO ACCEPT</span>
                <div>{timeLeft} seconds</div>
              </div>
              <h2 className="queue-heading">ACCEPT JOIN OFFER</h2>
              <div className="queue-buttons">
                <Button
                  color="red"
                  variant="light"
                  onClick={() => setQueueState('select')}
                >
                  Leave Queue
                </Button>
                <Button
                  variant="default"
                  onClick={() => setQueueState('ready')}
                >
                  Confirm
                </Button>
              </div>
            </div>
          )}
          {queueState === 'ready' && (
            <div>
              <div className="queue-timer">
                <Clock className="clock-icon" />
                <span>TIME TO JOIN</span>
                <div>{joinTime} minutes</div>
              </div>
              <h2 className="queue-heading">READY TO JOIN</h2>
              <div className="queue-buttons">
                <Button
                  color="red"
                  variant="light"
                  onClick={() => setQueueState('select')}
                >
                  Leave Queue
                </Button>
                <Button
                  variant="default"
                  onClick={() =>
                    (window.location.href = 'fivem://connect/yourserver.com')
                  }
                >
                  Join Server
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default QueueSystem;