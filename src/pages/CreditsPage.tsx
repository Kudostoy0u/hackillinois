import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { FiArrowLeft, FiExternalLink } from 'react-icons/fi'
import { Link } from 'react-router-dom'
import { Header } from '../components/Header'
import { CoastalScene } from '../components/beach/CoastalScene'

const creditGroups = [
  { title: 'Developer', content: 'Kundan Baliga' },
  {
    title: 'HackIllinois logo',
    content: 'HackIllinois 2022',
    href: 'https://2022.hackillinois.org/',
  },
  {
    title: 'Site favicon',
    content: 'HackIllinois 2021 Schedule',
    href: 'https://2021.hackillinois.org/schedule',
  },
  {
    title: 'Schedule event data',
    content: 'HackIllinois Adonix API',
    href: 'https://adonix.hackillinois.org/docs/',
  },
  {
    title: 'Iconography',
    content: 'React Icons',
    href: 'https://react-icons.github.io/react-icons/',
  },
  {
    title: 'Animation',
    content: 'Framer Motion',
    href: 'https://www.framer.com/motion/',
  },
  {
    title: 'Typography',
    content: 'Google Fonts',
    href: 'https://fonts.google.com/',
  },
  {
    title: 'Beach scene & interactions',
    content: 'Original code-native artwork by Kundan Baliga',
  },
]

export function CreditsPage() {
  useEffect(() => {
    document.title = 'Credits | HackIllinois Schedule'
  }, [])

  return (
    <div className="app-shell credits-shell">
      <CoastalScene ripples={[]} />
      <Header />
      <main className="credits-main">
        <motion.div
          className="credits-card"
          initial={{ opacity: 0, y: 24, rotate: -0.8 }}
          animate={{ opacity: 1, y: 0, rotate: -0.35 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="postcard-stamp" aria-hidden="true">
            HI
            <span>2027</span>
          </div>
          <Link className="back-link" to="/">
            <FiArrowLeft /> Back to schedule
          </Link>
          <span className="eyebrow">Made with care in Champaign</span>
          <h1>Credits & thanks</h1>
          <p className="credits-lede">
            This shoreline was shaped by a community of makers and a few wonderful open-source resources.
          </p>
          <div className="credits-grid">
            {creditGroups.map((credit) => (
              <div className="credit-item" key={credit.title}>
                <span>{credit.title}</span>
                {credit.href ? (
                  <a href={credit.href} target="_blank" rel="noreferrer">
                    {credit.content} <FiExternalLink />
                  </a>
                ) : (
                  <strong>{credit.content}</strong>
                )}
              </div>
            ))}
          </div>
          <p className="credits-note">
            The beach, water, waves, shells, birds, and sun on this version are original code-native artwork.
          </p>
        </motion.div>
      </main>
    </div>
  )
}

