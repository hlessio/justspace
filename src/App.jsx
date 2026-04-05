import { useState, useEffect } from 'react'

function App() {
  const [viewport, setViewport] = useState({ width: window.innerWidth, height: window.innerHeight })

  useEffect(() => {
    const onResize = () => setViewport({ width: window.innerWidth, height: window.innerHeight })
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  return (
    <div style={{ width: viewport.width, height: viewport.height, background: '#0a0a0f', overflow: 'hidden' }}>
      <span style={{ color: '#fff', padding: 20, display: 'block' }}>
        Spatial Engine — {viewport.width}×{viewport.height}
      </span>
    </div>
  )
}

export default App
