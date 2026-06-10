import React from "react";
import { ErrorState } from "@meridian/ui";

/**
 * Error boundary around each federated remote. A remote being down or failing to
 * load must not take down the whole shell — it shows a localized error instead.
 */
export class RemoteBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidUpdate(prev) {
    if (prev.routeKey !== this.props.routeKey && this.state.error) this.setState({ error: null });
  }
  render() {
    if (this.state.error) {
      return (
        <ErrorState
          title={`Couldn't load the “${this.props.name}” module`}
          message={`${this.state.error.message}. Make sure its dev server is running.`}
          onRetry={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
