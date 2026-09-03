import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet-async';
import { Button } from '@mantine/core';
import { Clock } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Queue.css';
import acceptSound from '../../assets/alert.mp3';
import { supabase } from '../../supabase';

type QueueState = 'select' | 'verification' | 'position' | 'accept' | 'ready';
type QueueType = 'regular' | 'police' | 'ems';

const QueueSystem: React.FC = () => {
  const [queueState, setQueueState] = useState<QueueState>('select');
  const [selectedQueue, setSelectedQueue] = useState<QueueType | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [joinTime, setJoinTime] = useState(5);
  const [position, setPosition] = useState(42);
  const [queueLength, setQueueLength] = useState(150);
  const [timeInQueue, setTimeInQueue] = useState(0);
  const [discordId, setDiscordId] = useState<string | null>(null);
  const [useFallback, setUseFallback] = useState(false);
  const navigate = useNavigate();
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        // Try to extract Discord ID from Supabase identities
        const discordIdentity = session.user.identities?.find(i => i.provider === 'discord');
        if (discordIdentity) {
          setDiscordId(discordIdentity.id);
        } else if (session.user.user_metadata?.provider_id) {
          setDiscordId(session.user.user_metadata.provider_id);
        }
      }
    };
    fetchUser();
  }, []);

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

  // Queue Movement Logic
  useEffect(() => {
    if (queueState === 'position') {
      const timeTimer = setInterval(() => {
        setTimeInQueue((prev) => prev + 1);
      }, 1000);

      const fetchRealQueue = async () => {
        if (!discordId) {
          setUseFallback(true);
          return;
        }
        
        try {
          const res = await fetch(`http://117.242.46.44:30120/fivem-synthwave-queue/status?discordId=${discordId}`);
          if (!res.ok) throw new Error("API Offline");
          
          const data = await res.json();
          setUseFallback(false);
          
          if (data.position > 0) {
            setPosition(data.position);
            setQueueLength(data.totalQueue > 0 ? data.totalQueue : data.position);
          } else if (data.position === 0 && data.inQueue) {
             // Position 0 means it's our turn!
             setQueueState('accept');
          }
        } catch (error) {
          // If server API fails (e.g., script not installed yet), use fallback simulation
          setUseFallback(true);
        }
      };

      let positionTimer: any;
      let realPollTimer: any;

      if (useFallback) {
        // Simulate position dropping every 2-5 seconds
        const moveQueue = () => {
          setPosition((prev) => {
            if (prev <= 1) {
              setQueueState('accept');
              return 0;
            }
            return prev - 1;
          });
          
          if (queueState === 'position') {
             const nextMoveDelay = Math.floor(Math.random() * 3000) + 2000;
             positionTimer = setTimeout(moveQueue, nextMoveDelay);
          }
        };
        positionTimer = setTimeout(moveQueue, 3000);
      } else {
        // Poll real server every 5 seconds
        fetchRealQueue();
        realPollTimer = setInterval(fetchRealQueue, 5000);
      }

      return () => {
        clearInterval(timeTimer);
        if (positionTimer) clearTimeout(positionTimer);
        if (realPollTimer) clearInterval(realPollTimer);
      };
    }
  }, [queueState, useFallback, discordId]);

  // Handle actual server connection when ready
  useEffect(() => {
    if (queueState === 'ready') {
      // Small delay before auto-launching
      const timer = setTimeout(() => {
        window.location.href = 'fivem://connect/117.242.46.44';
      }, 2000);
      return () => clearTimeout(timer);
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
              <p className="queue-label" style={{textAlign: 'center', marginBottom: '10px'}}>
                Choose the queue you want to join. Priority is based on your Discord roles.
              </p>
              {!discordId ? (
                <Button 
                  fullWidth 
                  color="indigo" 
                  onClick={() => navigate('/login')}
                  style={{ marginBottom: '20px', height: '50px', backgroundColor: '#5865F2' }}
                >
                  LOG IN WITH DISCORD TO JOIN
                </Button>
              ) : (
                <div
                  onClick={() => {
                    setSelectedQueue('regular');
                    setPosition(Math.floor(Math.random() * 50) + 20); // Random starting position 20-70
                    setQueueLength(150);
                    setQueueState('position');
                  }}
                  className="queue-option" style={{cursor: 'pointer', padding: '15px', border: '1px solid #333', marginBottom: '20px', borderRadius: '4px', textAlign: 'center'}}>
                  REGULAR QUEUE
                </div>
              )}
              <div className="queue-buttons">
                <Button onClick={handleGoBack} color="red" variant="light">
                  Go Back
                </Button>
              </div>
            </div>
          )}
          {queueState === 'position' && (
            <div>
              {useFallback && (
                <div style={{color: '#ffcc00', fontSize: '0.75rem', textAlign: 'center', marginBottom: '10px'}}>
                  SERVER API OFFLINE - RUNNING SIMULATION MODE
                </div>
              )}
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
                    (window.location.href = 'fivem://connect/117.242.46.44')
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