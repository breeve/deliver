package command

type Group struct {
}

func (g *Group) AddGroup(group *Group) error {
	return nil
}

func (g *Group) AddCommand(cmd *Command) error {
	return nil
}

func (g *Group) Execute(argOrigin string) error {
	// change to child OR exec cmd-self
	return nil
}

func NewGroup() *Group {
	return nil
}
