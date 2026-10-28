export function TouchControls() {
  return (
    <div id="touch">
      <div className="pad">
        <button data-k="left" aria-label="Move left">
          &#9664;
        </button>
        <button data-k="right" aria-label="Move right">
          &#9654;
        </button>
      </div>
      <div className="pad">
        <button data-k="shove">SHOVE</button>
        <button data-k="jump">JUMP</button>
      </div>
    </div>
  );
}

