import { Component } from 'react';
export class ErrorBoundary extends Component {
  state = {
    failed: false
  };
  static getDerivedStateFromError() {
    return {
      failed: true
    };
  }
  componentDidCatch(error, info) {
    console.error('纪念册渲染失败', error, info);
  }
  render() {
    if (!this.state.failed) return this.props.children;
    return <div className="loading" role="alert"><div>
      <p>页面未能打开，请重新加载。</p>
      <button onClick={() => window.location.reload()}>重新加载</button>
    </div></div>;
  }
}
