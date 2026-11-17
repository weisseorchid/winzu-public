function App() {
  return (
    <div className="app">
      <header className="header">
        <div className="winzu-logo">
          <img
            className="winzu-logo__mark"
            src="/icons/winzu_logo.svg"
            alt=""
            width={32}
            height={55}
          />
          <h1 className="winzu-logo__title">
            <span className="winzu-logo__name">winzu</span>
            <span className="winzu-logo__tag">projects</span>
          </h1>
        </div>
      </header>

      <main className="main">
        <img
          className="wip"
          src="/images/WIP_white.jpg"
          alt="Work in progress illustration"
        />
      </main>
    </div>
  )
}

export default App
