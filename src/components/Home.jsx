export default function Home({ onSelect }) {
  return (
    <div className="home">
      <div className="home-mark">
        <img src="/logo.png" alt="Engetmix" className="home-logo" />
        <h1>Almoxarifado</h1>
        <p className="home-sub">Controle de materiais, entradas e saídas</p>
      </div>

      <div className="home-doors">
        <button className="door" onClick={() => onSelect('visitor')}>
          <span className="door-eyebrow">Acesso rápido</span>
          <span className="door-title">Pesquisar &amp; requisitar</span>
          <span className="door-desc">Buscar materiais no estoque e pedir a saída de um item.</span>
        </button>

        <button className="door door-admin" onClick={() => onSelect('adminLogin')}>
          <span className="door-eyebrow">Acesso restrito</span>
          <span className="door-title">Sou o almoxarife</span>
          <span className="door-desc">Cadastrar itens, aprovar requisições e ver o histórico.</span>
        </button>
      </div>
    </div>
  )
}
