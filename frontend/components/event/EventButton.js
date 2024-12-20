import styles from './EventButton.module.css'

export default function EventButton({ children, onClick }) {
  return (
    <div className={styles.wrapper}>
      <button
        className={`btn ${styles.btnEvent} ${styles.button}`}
        onClick={onClick}
      >
        {children}
      </button>
    </div>
  )
}
