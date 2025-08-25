class AuthController {
  public static instance: AuthController;

  static getInstance() {
    if (!AuthController.instance) {
      AuthController.instance = new AuthController();
    }
    return AuthController.instance;
  }

  public register = async (req: any, res: any) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password required" });
      }

      res.json({ message: "User registered successfully", user: { username } });
    } catch (err: any) {
      console.error("Error registering user:", err);
      return res.status(500).json({ error: "Failed to register user" });
    }
  };

  public login = async (req: any, res: any) => {
    try {
      const { username, password } = req.body;
      if (!username || !password) {
        return res
          .status(400)
          .json({ error: "Username and password required" });
      }

      res.json({ message: "User logged in successfully", user: { username } });
    } catch (err: any) {
      console.error("Error logging in user:", err);
      return res.status(500).json({ error: "Failed to log in user" });
    }
  };
}

const AuthControllerService = AuthController.getInstance();

export default AuthControllerService;
