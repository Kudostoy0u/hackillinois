import { Link, NavLink, useLocation } from 'react-router-dom'
import { LOGO_URL } from '../config'

export function Header() {
  const location = useLocation()
  const scheduleActive = location.pathname === '/'

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link className="brand" to="/" aria-label="HackIllinois schedule home">
          <img src={LOGO_URL} alt="HackIllinois" />
        </Link>
        <nav className="main-nav" aria-label="Main navigation">
          <Link className={scheduleActive ? 'active' : ''} to="/">
            Schedule
          </Link>
          <a href="https://2025.hackillinois.org/mentors">Mentors</a>
          <a href="https://2025.hackillinois.org/prizes">Prizes</a>
          <NavLink to="/credits">Credits</NavLink>
        </nav>
      </div>
    </header>
  )
}

