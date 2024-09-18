package command

type Group struct {
}

func (g *Group) AddGroup(group *Group) error {
	return nil
}

func (g *Group) AddCommand(cmd *Command) error {
	return nil
}

func (g *Group) Execute(argOrigin string) (stdOut string, stdErr string, err error) {
	// change to child OR exec cmd-self
	return "", "", nil
}

func (g *Group) CommandPath() string {
	return ""
}

func NewGroup() *Group {
	return nil
}
