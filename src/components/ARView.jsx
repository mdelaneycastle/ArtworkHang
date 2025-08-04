import React, { useState, useRef, useEffect } from 'react'
import { X, Move, RotateCw, ZoomIn, ZoomOut, Download } from 'lucide-react'
import { useAR } from '../hooks/useAR'
import html2canvas from 'html2canvas'
import './ARView.css'

const ARView = ({ selectedArtwork, artworkData, onClose }) => {
  const {
    isARActive,
    deviceOrientation,
    cameraStream,
    videoRef,
    startAR,
    stopAR,
    worldToScreen
  } = useAR()

  const [artworkPosition, setArtworkPosition] = useState({ x: 50, y: 50, z: 100 })
  const [artworkScale, setArtworkScale] = useState(1)
  const [artworkRotation, setArtworkRotation] = useState(0)
  const [isPlacing, setIsPlacing] = useState(false)
  const [referenceDistance, setReferenceDistance] = useState(100) // cm from wall
  const [showControls, setShowControls] = useState(true)
  
  const arContainerRef = useRef(null)
  const artworkRef = useRef(null)

  // Find artwork data
  const artwork = artworkData.find(artist => 
    artist.images.some(img => img.name === selectedArtwork)
  )?.images.find(img => img.name === selectedArtwork)

  // Start AR when component mounts
  useEffect(() => {
    const initAR = async () => {
      try {
        await startAR()
      } catch (error) {
        console.error('Failed to start AR:', error)
        
        let message = 'AR mode requires camera access. '
        if (error.name === 'NotAllowedError') {
          message += 'Please allow camera access and try again.'
        } else if (error.name === 'NotFoundError') {
          message += 'No camera found on this device.'
        } else if (error.name === 'NotReadableError') {
          message += 'Camera is being used by another app.'
        } else {
          message += 'Please check your browser settings and try again.'
        }
        
        alert(message)
        onClose()
      }
    }

    initAR()

    return () => {
      stopAR()
    }
  }, [startAR, stopAR, onClose])

  // Handle touch/click for artwork placement
  const handleScreenTouch = (event) => {
    if (!isPlacing) return

    const rect = arContainerRef.current.getBoundingClientRect()
    const touchX = ((event.clientX || event.touches[0].clientX) - rect.left) / rect.width * 100
    const touchY = ((event.clientY || event.touches[0].clientY) - rect.top) / rect.height * 100

    setArtworkPosition(prev => ({ ...prev, x: touchX, y: touchY }))
    setIsPlacing(false)
  }

  // Calculate real-world artwork size based on distance and device
  const calculateArtworkSize = () => {
    if (!artwork) return { width: 100, height: 100 }

    // Base calculation: artwork size in cm converted to pixels
    // This is a simplified calculation - in production you'd use more sophisticated AR libraries
    const baseSize = artwork.initialSize // cm
    const pixelsPerCm = window.innerWidth / 40 // Rough estimate: 40cm screen width
    const distanceScale = 100 / referenceDistance // Scale based on distance
    
    const realWidth = baseSize * pixelsPerCm * artworkScale * distanceScale
    
    // Calculate height based on artwork aspect ratio
    const img = new Image()
    img.src = selectedArtwork
    const aspectRatio = img.naturalHeight / img.naturalWidth || 1
    
    return {
      width: realWidth,
      height: realWidth * aspectRatio
    }
  }

  const artworkSize = calculateArtworkSize()

  // Apply device orientation to artwork (simple tilt effect)
  const getArtworkTransform = () => {
    const tiltX = deviceOrientation.beta * 0.1 // Subtle tilt based on device
    const tiltY = deviceOrientation.gamma * 0.1
    
    return `
      translate(-50%, -50%)
      perspective(1000px)
      rotateX(${tiltX}deg)
      rotateY(${tiltY + artworkRotation}deg)
      scale(${artworkScale})
    `
  }

  const downloadARImage = async () => {
    setShowControls(false)
    
    try {
      const canvas = await html2canvas(arContainerRef.current, {
        useCORS: true,
        scale: 2,
        backgroundColor: null
      })
      
      const link = document.createElement('a')
      link.download = 'ar-artwork-preview.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      setShowControls(true)
    }
  }

  return (
    <div className="ar-view" ref={arContainerRef}>
      {/* Camera background */}
      <video
        ref={videoRef}
        className="ar-camera"
        autoPlay
        playsInline
        muted
      />

      {/* Artwork overlay */}
      {selectedArtwork && (
        <div
          ref={artworkRef}
          className="ar-artwork"
          style={{
            left: `${artworkPosition.x}%`,
            top: `${artworkPosition.y}%`,
            width: artworkSize.width,
            height: artworkSize.height,
            backgroundImage: `url(${selectedArtwork})`,
            transform: getArtworkTransform(),
            zIndex: isPlacing ? 1000 : 10
          }}
        />
      )}

      {/* Placement indicator */}
      {isPlacing && (
        <div className="placement-indicator">
          <div className="crosshair"></div>
          <p>Tap where you want to place the artwork</p>
        </div>
      )}

      {/* AR Controls */}
      {showControls && (
        <div className="ar-controls">
          <div className="ar-controls-top">
            <button className="ar-close-btn" onClick={onClose}>
              <X size={24} />
            </button>
            <div className="ar-info">
              <span>{artwork?.title || 'Artwork'}</span>
              <span>{artwork?.initialSize}cm</span>
            </div>
          </div>

          <div className="ar-controls-bottom">
            <div className="ar-control-group">
              <button 
                className={`ar-control-btn ${isPlacing ? 'active' : ''}`}
                onClick={() => setIsPlacing(!isPlacing)}
              >
                <Move size={20} />
                <span>Place</span>
              </button>
              
              <button 
                className="ar-control-btn"
                onClick={() => setArtworkRotation(prev => prev + 15)}
              >
                <RotateCw size={20} />
                <span>Rotate</span>
              </button>
              
              <button 
                className="ar-control-btn"
                onClick={() => setArtworkScale(prev => Math.max(0.5, prev - 0.1))}
              >
                <ZoomOut size={20} />
                <span>Smaller</span>
              </button>
              
              <button 
                className="ar-control-btn"
                onClick={() => setArtworkScale(prev => Math.min(2, prev + 0.1))}
              >
                <ZoomIn size={20} />
                <span>Larger</span>
              </button>
              
              <button 
                className="ar-control-btn"
                onClick={downloadARImage}
              >
                <Download size={20} />
                <span>Save</span>
              </button>
            </div>

            <div className="ar-distance-control">
              <label>
                Distance from wall: {referenceDistance}cm
                <input
                  type="range"
                  min="50"
                  max="300"
                  value={referenceDistance}
                  onChange={(e) => setReferenceDistance(parseInt(e.target.value))}
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* Touch handler for placement */}
      <div 
        className="ar-touch-overlay"
        onTouchStart={handleScreenTouch}
        onClick={handleScreenTouch}
      />
    </div>
  )
}

export default ARView