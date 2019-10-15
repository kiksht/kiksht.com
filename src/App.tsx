import React, { Component } from "react";
import { BrowserRouter as Router, Redirect, Switch, Route, Link } from "react-router-dom";
import Fuse from "fuse.js";

import "./App.css";
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
    user: undefined | { email: string };
}> {
    render() {
        if (this.props.user === undefined) {
            return (
                <div>
                    <p>
                        <a href="https://en.wikipedia.org/wiki/Kiksht" target="_target">
                            Kiksht
                        </a>{" "}
                        is a dialect of Upper Chinook that was spoken along the Columbia River in
                        present day Washington and Oregon.
                    </p>
                    <p>
                        This site contains resources for learning, reading, writing, and speaking
                        the language. If you are an enrolled member of the{" "}
                        <a href="https://warmsprings-nsn.gov/" target="_target">
                            Confederated Tribes of Warm Springs
                        </a>
                        , you can <Link to="/login">create an account</Link> to access these
                        materials.
                    </p>
                </div>
            );
        } else {
            return (
                <div>
                    <p>Hello, {this.props.user.email}!</p>
                    <p>
                        kiksht.com does not have many resources yet, but we do have a searchable
                        version of our <Link to="/dictionary">dictionary</Link>. Please do let us
                        know if you encounter bugs!
                    </p>
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
                        Email:{" "}
                        <input type="text" name="email" id="email" autoFocus required></input>
                    </div>
                    <div>
                        Password:{" "}
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
                        Email:{" "}
                        <input type="text" name="email" id="email" autoFocus required></input>
                    </div>
                    <div>
                        Password:{" "}
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
    {
        query: string;
        matches: [string, kiksht.Entry][];
        dictionary: undefined | Fuse<kiksht.Entry>;
    }
> {
    state = {
        query: "",
        matches: [] as [string, kiksht.Entry][],
        dictionary: undefined as undefined | Fuse<kiksht.Entry>,
    };

    debounceTimer: NodeJS.Timeout | undefined;

    updateMatches(query: string) {
        if (query === "") {
            this.setState({ query, matches: [] });
            return;
        }

        if (this.state.dictionary !== undefined) {
            // Update query box. This is cheap so we can do it every time.
            this.setState({ query });

            // Debounce computing matches because rendering them is very
            // expensive.
            clearTimeout(this.debounceTimer as NodeJS.Timeout);
            const dict = this.state.dictionary;
            this.debounceTimer = setTimeout(() => {
                const matches = dict
                    .search(query)
                    .map<[string, kiksht.Entry]>(entry => [entry.root, entry])
                    .slice(0, 100);
                this.setState({ matches });
            }, 100);
        } else {
            this.setState({ query, matches: [] });
        }
    }

    handleSearchBoxUpdate(e: React.ChangeEvent<HTMLInputElement>) {
        const query = e.target.value;
        this.updateMatches(query);
    }

    render() {
        if (this.state.dictionary === undefined) {
            Api.dictionary().then(async resp => {
                if (resp.status === 200) {
                    const dictData = Object.entries<kiksht.Entry>(await resp.json()).map(
                        ([word, entry]) => {
                            entry.root = word;
                            return entry;
                        },
                    );
                    this.setState({
                        dictionary: new Fuse(dictData, {
                            keys: [
                                "root",
                                "partOfSpeech",
                                "definition",
                                "forms",
                                "examples",
                                "notes",
                                "seeAlso",
                                "pronunciation",
                            ],
                        }),
                    });
                    this.updateMatches(this.state.query);
                } else if (resp.status === 401) {
                    this.props.onUnauthorized();
                }
            });
        }

        return (
            <div className="dict">
                <form onSubmit={e => e.preventDefault()}>
                    <div>
                        <input
                            type="text"
                            placeholder="Type word here"
                            value={this.state.query}
                            onChange={e => this.handleSearchBoxUpdate(e)}
                            autoFocus
                        ></input>
                    </div>
                </form>
                <ul>
                    {this.state.matches.map(([word, entry]) => (
                        <li>
                            <DictionaryEntry word={word} entry={entry} />
                        </li>
                    ))}
                </ul>
            </div>
        );
    }
}

class DictionaryEntry extends Component<{ word: string; entry: kiksht.Entry }> {
    render() {
        const entry = this.props.entry;
        const forms =
            entry.forms === undefined || entry.forms == null || entry.forms.length === 0 ? (
                ""
            ) : (
                <div>
                    <i>Forms:</i>
                    <ul>
                        {entry.forms.map(form => (
                            <li>
                                <i>{form.kiksht}</i>: {form.english}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        const examples =
            entry.examples === undefined ||
            entry.examples == null ||
            entry.examples.length === 0 ? (
                ""
            ) : (
                <div>
                    <i>Examples:</i>
                    <ul>
                        {entry.examples.map(form => (
                            <li>
                                <i>{form.kiksht}</i>: {form.english}
                            </li>
                        ))}
                    </ul>
                </div>
            );
        const notes =
            entry.notes === undefined || entry.notes == null || entry.notes.length === 0 ? (
                ""
            ) : (
                <div>
                    <i>Notes:</i> {entry.notes.join(", ")}
                </div>
            );
        const seeAlso =
            entry.seeAlso === undefined || entry.seeAlso == null || entry.seeAlso.length === 0 ? (
                ""
            ) : (
                <div>
                    <i>See also:</i> {entry.seeAlso.join(", ")}
                </div>
            );
        const pronunciation =
            entry.pronunciation === undefined || entry.pronunciation == null ? (
                ""
            ) : (
                <div>
                    <i>Pronunciation:</i> {entry.pronunciation}
                </div>
            );

        return (
            <div className="dict-entry">
                <b>{this.props.word}</b>: [<i>{entry.partOfSpeech}</i>] {entry.definition}
                {forms}
                {examples}
                {notes}
                {seeAlso}
                {pronunciation}
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

    async handleLogout(e: React.FormEvent<HTMLAnchorElement>) {
        e.preventDefault();
        const resp = await Api.logout();
        console.log(`logout ${resp.status}`);
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

        const navUl =
            this.state.user === undefined ? (
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
                </ul>
            ) : (
                <ul>
                    <li>
                        <Link to="/">Home</Link>
                    </li>
                    <li>
                        <Link to="/dictionary">Dictionary</Link>
                    </li>
                    <li>
                        <Link to="" onClick={e => this.handleLogout(e)}>
                            Sign out
                        </Link>
                    </li>
                </ul>
            );

        return (
            <Router>
                <div>
                    <nav className="nav">{navUl}</nav>

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
                            <Home user={this.state.user} />
                        </Route>
                    </Switch>
                </div>
            </Router>
        );
    }
}
