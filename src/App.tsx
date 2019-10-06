import React, { Component } from "react";
import { BrowserRouter as Router, Redirect, Switch, Route, Link } from "react-router-dom";
import * as kiksht from "./kiksht";

class Api {
    public static login(email: string, password: string): Promise<Response> {
        return fetch("/api/v1/login", {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
    }

    public static logout(): Promise<Response> {
        return fetch("/api/v1/logout", {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
    }

    public static register(email: string, password: string): Promise<Response> {
        return fetch("/api/v1/register", {
            method: "POST",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password }),
        });
    }

    public static dictionary(): Promise<Response> {
        return fetch("/api/v1/dictionary", {
            method: "GET",
            credentials: "include",
        });
    }

    public static currentUser(): Promise<Response> {
        return fetch("/api/v1/current-user", {
            method: "GET",
            credentials: "include",
            headers: {
                Accept: "application/json",
                "Content-Type": "application/json",
            },
        });
    }
}

class Home extends Component<{
    onLogout: (e: React.FormEvent<HTMLFormElement>) => void;
    user: undefined | { email: string };
}> {
    render() {
        if (this.props.user === undefined) {
            return (
                <div>
                    <h2>Home</h2>
                </div>
            );
        } else {
            return (
                <div>
                    <h2>Home</h2>
                    <p>Hello, {this.props.user.email}</p>
                    <form onSubmit={this.props.onLogout} method="post">
                        <div>
                            <input type="submit" name="submit" value="Logout" />
                        </div>
                    </form>
                </div>
            );
        }
    }
}

class Login extends Component<{
    prevError: undefined | string;
    onLogin: (e: React.FormEvent<HTMLFormElement>) => void;
}> {
    render() {
        return (
            <div>
                <h2>Log in</h2>
                {this.props.prevError === undefined ? "" : <p>Error: {this.props.prevError}</p>}
                <form onSubmit={this.props.onLogin} method="post">
                    <div>
                        <input type="text" name="email" id="email" required></input>
                    </div>
                    <div>
                        <input type="password" name="password" id="password" required></input>
                    </div>
                    <div>
                        <input type="submit" value="submit"></input>
                    </div>
                </form>
            </div>
        );
    }
}

class Register extends Component<{
    prevError: undefined | string;
    onRegister: (e: React.FormEvent<HTMLFormElement>) => void;
}> {
    render() {
        return (
            <div>
                <h2>Register</h2>
                {this.props.prevError === undefined ? "" : <p>Error: {this.props.prevError}</p>}
                <form onSubmit={this.props.onRegister} method="post">
                    <div>
                        <input type="text" name="email" id="email" required></input>
                    </div>
                    <div>
                        <input type="password" name="password" id="password" required></input>
                    </div>
                    <div>
                        <input type="submit" value="submit"></input>
                    </div>
                </form>
            </div>
        );
    }
}

class Dictionary extends Component<
    { onUnauthorized: () => void },
    { query: string; matches: [string, kiksht.Entry][]; dictionary: kiksht.Dictionary }
> {
    state = {
        query: "",
        matches: [] as [string, kiksht.Entry][],
        dictionary: {} as kiksht.Dictionary,
    };

    handleSearchBoxUpdate(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value;
        const matches: [string, kiksht.Entry][] = [];
        for (const [w, entry] of Object.entries(this.state.dictionary)) {
            if (w.includes(query)) {
                matches.push([w, entry]);
            }
        }

        this.setState({ query, matches });
    }

    render() {
        Api.dictionary().then(async resp => {
            if (resp.status === 200) {
                this.setState({ dictionary: await resp.json() });
            } else if (resp.status === 401) {
                this.props.onUnauthorized();
            }
        });

        return (
            <div>
                <form onSubmit={e => e.preventDefault()}>
                    <div>
                        <input
                            type="text"
                            value={this.state.query}
                            onChange={e => this.handleSearchBoxUpdate(e)}
                            autoFocus
                        ></input>
                    </div>
                </form>
                <ul>
                    {this.state.matches.map(([word, entry]) => (
                        // <li key={item.id}>{item.text}</li>
                        <li>{`${word}: [${entry.partOfSpeech}] ${entry.definition}`}</li>
                    ))}
                </ul>
                {/* {JSON.stringify(this.state.dictionary, undefined, "  ")} */}
            </div>
        );
    }
}

export default class App extends Component<
    {},
    {
        redirectTo: undefined | string | [string, string];
        user: undefined | { email: string };
        registration: {
            prevError: undefined | string;
        };
        login: {
            prevError: undefined | string;
        };
    }
> {
    state = {
        redirectTo: undefined as any,
        user: undefined as any,
        registration: { prevError: undefined as any },
        login: { prevError: undefined as any },
    };

    async handleLogin(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const data = new FormData(e.currentTarget);
        const email = data.get("email") as string;
        const password = data.get("password") as string;

        const loginResp = await Api.login(email, password);
        if (loginResp.status === 200) {
            this.setState({ redirectTo: "/", login: { prevError: undefined } });
        } else {
            this.setState({
                redirectTo: undefined,
                login: { prevError: await loginResp.text() },
            });
        }
    }

    async handleLogout(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const resp = await Api.logout();
        this.setState({ redirectTo: resp.status === 200 ? "/" : undefined, user: undefined });
    }

    async handleUnauthorized() {
        this.setState({ redirectTo: "/login" });
    }

    async handleRegister(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();

        const data = new FormData(e.currentTarget);
        const email = data.get("email") as string;
        const password = data.get("password") as string;

        const registerResp = await Api.register(email, password);
        if (registerResp.status === 200) {
            // TODO: Direct to log in.
            this.setState({ redirectTo: "/", registration: { prevError: undefined } });
            const loginResp = await Api.login(email, password);
            this.setState({ redirectTo: loginResp.status === 200 ? "/" : undefined });
        } else {
            this.setState({
                redirectTo: undefined,
                registration: { prevError: await registerResp.text() },
            });
        }
    }

    render() {
        if (this.state.redirectTo !== undefined) {
            const redirect = this.state.redirectTo;
            this.setState({ redirectTo: undefined });
            return (
                <Router>
                    <Redirect to={redirect} />
                </Router>
            );
        }

        if (this.state.user === undefined) {
            Api.currentUser().then(async resp => {
                if (resp.status === 200) {
                    this.setState({ user: await resp.json() });
                }
            });
        }

        let dictionaryNav =
            this.state.user === undefined ? (
                ""
            ) : (
                <li>
                    <Link to="/dictionary">Dictionary</Link>
                </li>
            );

        return (
            <Router>
                <div>
                    <nav>
                        <ul>
                            <li>
                                <Link to="/">Home</Link>
                            </li>
                            <li>
                                <Link to="/login">Log in</Link>
                            </li>
                            <li>
                                <Link to="/register">Register</Link>
                            </li>
                            {dictionaryNav}
                        </ul>
                    </nav>

                    {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
                    <Switch>
                        <Route path="/login">
                            <Login
                                prevError={this.state.login.prevError}
                                onLogin={e => this.handleLogin(e)}
                            />
                        </Route>
                        <Route path="/register">
                            <Register
                                prevError={this.state.registration.prevError}
                                onRegister={e => this.handleRegister(e)}
                            />
                        </Route>
                        <Route path="/dictionary">
                            <Dictionary onUnauthorized={() => this.handleUnauthorized()} />
                        </Route>
                        <Route path="/">
                            <Home onLogout={e => this.handleLogout(e)} user={this.state.user} />
                        </Route>
                    </Switch>
                </div>
            </Router>
        );
    }
}
