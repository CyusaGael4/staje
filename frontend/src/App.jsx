import { useState, useEffect } from 'react'
import './App.css'

function App() {
  const [token, setToken] = useState(localStorage.getItem('token') || '')
  const [cars, setCars] = useState([])
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [carData, setCarData] = useState({
    PlateNumber: '',
    type: '',
    Model: '',
    ManufacturingYear: '',
    DriverPhone: '',
    MechanicName: ''
  })
  const [editingCar, setEditingCar] = useState(null)
  const [message, setMessage] = useState('')

  const API_BASE = 'http://localhost:5000/api'

  const logout = () => {
    setToken('')
    localStorage.removeItem('token')
    setCars([])
    setMessage('Session expired or unauthorized. Please login again.')
  }

  const checkAuthResponse = async (response) => {
    if (response.status === 401 || response.status === 403) {
      logout()
      return false
    }
    return true
  }

  useEffect(() => {
    if (token) {
      fetchCars()
    }
  }, [token])

  const handleLogin = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData)
      })
      const data = await response.json()
      if (response.ok) {
        setToken(data.token)
        localStorage.setItem('token', data.token)
        setMessage('Login successful')
      } else {
        setMessage(data.message)
      }
    } catch (error) {
      setMessage('Login failed')
    }
  }

  const fetchCars = async () => {
    try {
      const response = await fetch(`${API_BASE}/cars`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (!(await checkAuthResponse(response))) return
      if (response.ok) {
        setCars(data)
      } else {
        setMessage(data.message || 'Unable to fetch cars')
      }
    } catch (error) {
      console.error('Fetch cars error', error)
      setMessage('Failed to fetch cars')
    }
  }

  const handleAddCar = async (e) => {
    e.preventDefault()
    try {
      const response = await fetch(`${API_BASE}/cars`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(carData)
      })
      const data = await response.json()
      if (!(await checkAuthResponse(response))) return
      if (response.ok) {
        setMessage('Car added successfully')
        setCarData({
          PlateNumber: '',
          type: '',
          Model: '',
          ManufacturingYear: '',
          DriverPhone: '',
          MechanicName: ''
        })
        fetchCars()
      } else {
        setMessage(data.message || 'Unable to add car')
      }
    } catch (error) {
      setMessage('Failed to add car')
    }
  }

  const handleUpdateCar = async (e) => {
    e.preventDefault()
    if (!editingCar) {
      setMessage('No car selected to update.')
      return
    }
    try {
      const response = await fetch(`${API_BASE}/cars/${editingCar.PlateNumber}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(carData)
      })
      const data = await response.json()
      if (!(await checkAuthResponse(response))) return
      if (response.ok) {
        setMessage('Car updated successfully')
        setEditingCar(null)
        setCarData({
          PlateNumber: '',
          type: '',
          Model: '',
          ManufacturingYear: '',
          DriverPhone: '',
          MechanicName: ''
        })
        fetchCars()
      } else {
        console.error('Update failed', data)
        setMessage(data.message || 'Unable to update car')
      }
    } catch (error) {
      console.error('Update error', error)
      setMessage('Failed to update car')
    }
  }

  const handleDeleteCar = async (plateNumber) => {
    if (!confirm('Are you sure you want to delete this car?')) return
    try {
      const response = await fetch(`${API_BASE}/cars/${plateNumber}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      if (!(await checkAuthResponse(response))) return
      if (response.ok) {
        setMessage('Car deleted successfully')
        fetchCars()
      } else {
        console.error('Delete failed', data)
        setMessage(data.message || 'Unable to delete car')
      }
    } catch (error) {
      console.error('Delete error', error)
      setMessage('Failed to delete car')
    }
  }

  const startEdit = (car) => {
    setEditingCar(car)
    setCarData({
      PlateNumber: car.PlateNumber,
      type: car.type,
      Model: car.Model,
      ManufacturingYear: car.ManufacturingYear,
      DriverPhone: car.DriverPhone,
      MechanicName: car.MechanicName
    })
  }

  const cancelEdit = () => {
    setEditingCar(null)
    setCarData({
      PlateNumber: '',
      type: '',
      Model: '',
      ManufacturingYear: '',
      DriverPhone: '',
      MechanicName: ''
    })
  }

  const logout = () => {
    setToken('')
    localStorage.removeItem('token')
    setCars([])
    setMessage('')
  }

  if (!token) {
    return (
      <div className="login">
        <h1>Login</h1>
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Username"
            value={loginData.username}
            onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={loginData.password}
            onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
            required
          />
          <button type="submit">Login</button>
        </form>
        {message && <p>{message}</p>}
      </div>
    )
  }

  return (
    <div className="app">
      <header>
        <h1>Car Management</h1>
        <button onClick={logout}>Logout</button>
      </header>
      {message && <p className="message">{message}</p>}
      
      <div className="car-form">
        <h2>{editingCar ? 'Edit Car' : 'Add New Car'}</h2>
        <form onSubmit={editingCar ? handleUpdateCar : handleAddCar}>
          <input
            type="text"
            placeholder="Plate Number"
            value={carData.PlateNumber}
            onChange={(e) => setCarData({ ...carData, PlateNumber: e.target.value })}
            required
            disabled={!!editingCar}
          />
          <input
            type="text"
            placeholder="Type"
            value={carData.type}
            onChange={(e) => setCarData({ ...carData, type: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Model"
            value={carData.Model}
            onChange={(e) => setCarData({ ...carData, Model: e.target.value })}
            required
          />
          <input
            type="number"
            placeholder="Manufacturing Year"
            value={carData.ManufacturingYear}
            onChange={(e) => setCarData({ ...carData, ManufacturingYear: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Driver Phone"
            value={carData.DriverPhone}
            onChange={(e) => setCarData({ ...carData, DriverPhone: e.target.value })}
            required
          />
          <input
            type="text"
            placeholder="Mechanic Name"
            value={carData.MechanicName}
            onChange={(e) => setCarData({ ...carData, MechanicName: e.target.value })}
            required
          />
          <button type="submit">{editingCar ? 'Update Car' : 'Add Car'}</button>
          {editingCar && <button type="button" onClick={cancelEdit}>Cancel</button>}
        </form>
      </div>

      <div className="car-list">
        <h2>Cars</h2>
        {cars.length === 0 ? (
          <p>No cars found.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Plate Number</th>
                <th>Type</th>
                <th>Model</th>
                <th>Year</th>
                <th>Driver Phone</th>
                <th>Mechanic</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {cars.map((car) => (
                <tr key={car.PlateNumber}>
                  <td>{car.PlateNumber}</td>
                  <td>{car.type}</td>
                  <td>{car.Model}</td>
                  <td>{car.ManufacturingYear}</td>
                  <td>{car.DriverPhone}</td>
                  <td>{car.MechanicName}</td>
                  <td>
                    <button onClick={() => startEdit(car)}>Edit</button>
                    <button onClick={() => handleDeleteCar(car.PlateNumber)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}

export default App
