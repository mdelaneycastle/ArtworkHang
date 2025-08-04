import { useState, useRef, useCallback, useEffect } from 'react'

export const useAR = () => {
  const [isARActive, setIsARActive] = useState(false)
  const [isARSupported, setIsARSupported] = useState(false)
  const [deviceOrientation, setDeviceOrientation] = useState({ alpha: 0, beta: 0, gamma: 0 })
  const [deviceMotion, setDeviceMotion] = useState({ x: 0, y: 0, z: 0 })
  const [cameraStream, setCameraStream] = useState(null)
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // Check AR support - simplified and more permissive
  useEffect(() => {
    const checkARSupport = () => {
      // For testing, just enable AR on any device with touch or mobile user agent
      const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|Opera Mini|IEMobile/i.test(navigator.userAgent) ||
                      'ontouchstart' in window ||
                      navigator.maxTouchPoints > 0

      console.log('AR Support Check:', {
        userAgent: navigator.userAgent,
        isMobile,
        hasTouch: 'ontouchstart' in window,
        maxTouchPoints: navigator.maxTouchPoints
      })

      // Enable AR for mobile devices (we'll handle camera permissions later)
      setIsARSupported(isMobile)
    }

    checkARSupport()
  }, [])

  // Request device permissions (iOS requires user gesture)
  const requestPermissions = async () => {
    try {
      // Request device motion/orientation permissions (iOS 13+)
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const orientationPermission = await DeviceOrientationEvent.requestPermission()
        if (orientationPermission !== 'granted') {
          throw new Error('Device orientation permission denied')
        }
      }

      if (typeof DeviceMotionEvent.requestPermission === 'function') {
        const motionPermission = await DeviceMotionEvent.requestPermission()
        if (motionPermission !== 'granted') {
          throw new Error('Device motion permission denied')
        }
      }

      return true
    } catch (error) {
      console.warn('Permission request failed:', error)
      return false
    }
  }

  // Start AR session
  const startAR = useCallback(async () => {
    try {
      // Get camera stream first (this will trigger the permission prompt)
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'environment', // Back camera
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      })

      setCameraStream(stream)

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream
        videoRef.current.play()
      }

      // Request device motion/orientation permissions after camera is granted
      await requestPermissions()

      // Set up device orientation tracking
      const handleOrientation = (event) => {
        setDeviceOrientation({
          alpha: event.alpha || 0, // Z axis (compass)
          beta: event.beta || 0,   // X axis (tilt front/back)
          gamma: event.gamma || 0  // Y axis (tilt left/right)
        })
      }

      // Set up device motion tracking
      const handleMotion = (event) => {
        if (event.accelerationIncludingGravity) {
          setDeviceMotion({
            x: event.accelerationIncludingGravity.x || 0,
            y: event.accelerationIncludingGravity.y || 0,
            z: event.accelerationIncludingGravity.z || 0
          })
        }
      }

      window.addEventListener('deviceorientation', handleOrientation)
      window.addEventListener('devicemotion', handleMotion)

      setIsARActive(true)

      // Cleanup function
      return () => {
        window.removeEventListener('deviceorientation', handleOrientation)
        window.removeEventListener('devicemotion', handleMotion)
      }

    } catch (error) {
      console.error('Failed to start AR:', error)
      throw error
    }
  }, [])

  // Stop AR session
  const stopAR = useCallback(() => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop())
      setCameraStream(null)
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null
    }

    setIsARActive(false)
    setDeviceOrientation({ alpha: 0, beta: 0, gamma: 0 })
    setDeviceMotion({ x: 0, y: 0, z: 0 })
  }, [cameraStream])

  // Calculate device distance using device sensors and known reference
  const calculateDistance = useCallback((referenceSize, pixelSize) => {
    // This is a simplified distance calculation
    // In reality, you'd need more sophisticated computer vision
    const estimatedDistance = (referenceSize * 1000) / pixelSize // Rough estimate
    return Math.max(50, Math.min(500, estimatedDistance)) // Clamp between 50cm - 5m
  }, [])

  // Convert real-world coordinates to screen coordinates
  const worldToScreen = useCallback((worldX, worldY, worldZ, distance = 100) => {
    // Simple perspective projection
    const fov = 60 // Field of view in degrees
    const aspect = window.innerWidth / window.innerHeight
    
    // Apply device orientation
    const rotatedX = worldX * Math.cos(deviceOrientation.gamma * Math.PI / 180)
    const rotatedY = worldY * Math.cos(deviceOrientation.beta * Math.PI / 180)
    
    // Project to screen space
    const screenX = (rotatedX / distance) * (window.innerWidth / 2) + (window.innerWidth / 2)
    const screenY = (rotatedY / distance) * (window.innerHeight / 2) + (window.innerHeight / 2)
    
    return { x: screenX, y: screenY }
  }, [deviceOrientation])

  return {
    isARActive,
    isARSupported,
    deviceOrientation,
    deviceMotion,
    cameraStream,
    videoRef,
    canvasRef,
    startAR,
    stopAR,
    calculateDistance,
    worldToScreen
  }
}